/* eslint-disable no-restricted-globals */

import { Transaction } from "@ton/ton";
import { Address } from '@ton/core'
import { BEUniverses, CollectionType, FOUND, GetNftData, isNft, NFT, Nft, NftMeta, NftStore, NON_NFT, NonNft, WIN } from "@wonton-lib/Types.ts";
import { isTonAddress, possiblyNftTransfer } from "@wonton-lib/TonUtils.ts";
import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
import axios from "axios";
import { tryNTimes } from "@wonton-lib/PromisUtils.ts";
import { getErrorMessage } from "@wonton-lib/ErrorHandler.ts";
import { testOnly } from "../store/NftsStore.ts";
// import { getErrorMessage } from "../../modules/wonton-lib-common/src/ErrorHandler.ts";

// const nftItemCode = import.meta.env.VITE_NFT_ITEM_CODE;

export const digForNewNfts = async (walletAddress: Address,
    walletAddressStr: string,
    universes: BEUniverses,
    get: () => NftStore) => {
    try {
        await readTransactions(walletAddress, walletAddressStr, universes, get);
    } catch (ex) {
        // @ts-ignore
        console.error(ex.message)
        // @ts-ignore
        console.error(ex.stackTrace)
    }
}

const readTransactions = async (walletAddress: Address,
    walletAddressStr: string,
    universes: BEUniverses,
    get: () => NftStore) => {
    const haveNotProcessed = get().anyNotProcessedTransactions(walletAddressStr);

    const innerRead = async (hash?: string, lt?: string, limit: number = 30) => {
        const newTransactions = await tryRequestTransactionList(walletAddress, hash, lt, limit);
        // console.log(`Received ${newTransactions?.length} transactions`);
        if (!newTransactions) { return; }

        const hitBottom = newTransactions.length == 0 || newTransactions.length < limit;
        const processResult = await processTransactions(walletAddress, walletAddressStr, universes, newTransactions, haveNotProcessed, get);
        if ((hitBottom || processResult.hitBottom) && !haveNotProcessed) { return; }
        return await innerRead(processResult.lastHash, processResult.lastLt);
    }

    await innerRead();
}

const processTransactions = async (walletAddress: Address,
    walletAddressStr: string,
    universes: BEUniverses,
    receivedTransactions: Transaction[],
    haveNotProcessed: boolean,
    get: () => NftStore) => {
    let hitBottom: boolean = false;
    let lastHash: string | undefined;
    let lastLt: string | undefined;

    for (const tx of receivedTransactions) {
        const txHash = tx.hash().toString("base64");
        if (!get().isTransactionProcessed(walletAddressStr, txHash)) {
            get().addTransaction(walletAddressStr, { hash: txHash, lt: tx.lt, now: tx.now, state: FOUND });
            console.log(`Found unprocessed transaction: ${txHash}, tx.now: ${new Date(tx.now * 1000).toISOString()}`);
            const success = await handleWalletInTxs(walletAddress, walletAddressStr, universes, tx, get);
            if (success) {
                get().markTransactionAsProcessed(walletAddressStr, txHash);
            }

            lastHash = txHash;
            lastLt = tx.lt.toString();
        } else if (!haveNotProcessed) {
            hitBottom = true;
            break;
        }
    }

    return { lastHash, lastLt, hitBottom };
}

const requestTransactionList = async (walletAddress: Address, hash?: string, lt?: string, limit: number = 20) => {
    const tonClient = await wonTonClientProvider.wonTonClient();
    return await tonClient.getTransactions(walletAddress, { limit: limit, archival: true, inclusive: false, lt, hash });
}

const handleWalletInTxs = async (walletAddress: Address,
    walletAddressStr: string,
    universes: BEUniverses,
    tx: Transaction,
    get: () => NftStore): Promise<boolean> => {
    const inMsg = tx.inMessage;
    const nftAddress = inMsg?.info.src;
    if (isTonAddress(nftAddress) && possiblyNftTransfer(inMsg)) {
        console.log(`Possibly NFT found: ${nftAddress}`);
        const nftData = await tryGetNftData(nftAddress);
        if (!nftData) {
            console.log(`No nft data loaded`);
            return false;
        }

        const winNft = await handleTx('WIN', nftAddress, walletAddress, walletAddressStr, universes, tx, nftData, get);
        if (isNft(winNft)) {
            get().addNft(walletAddressStr, 'WIN', winNft);
        }

        const looseNft = await handleTx('LOOSE', nftAddress, walletAddress, walletAddressStr, universes, tx, nftData, get);
        if (isNft(looseNft)) {
            get().addNft(walletAddressStr, 'LOOSE', looseNft);
        }
    }

    return true;
}

const handleTx = async (cType: CollectionType,
    nftAddress: Address,
    walletAddress: Address,
    walletAddressStr: string,
    universes: BEUniverses,
    tx: Transaction,
    nftData: GetNftData,
    get: () => NftStore): Promise<Nft | NonNft | undefined> => {
    console.log(`Run handleTx for: ${cType}`);
    const collection = cType === WIN ? universes.winUniverse.collection : universes.looseUniverse.collection;
    const nftWontonPower = universes.wonTonPower + 1;
    console.log(`wallet address: ${walletAddressStr}`);
    console.log(`nftData.owner: ${nftData.owner.toString({ testOnly })}`);
    console.log(`collection: ${collection.toString({ testOnly })}`);
    console.log(`nftData.collection: ${nftData.collection.toString({ testOnly })}`);
    if (walletAddress.equals(nftData.owner) && collection.equals(nftData.collection)) {
        if (!get().doesNftExists(walletAddressStr, cType, nftWontonPower, nftData.index)) {
            console.log(`wontonPower: ${universes.wonTonPower} | Found new ${cType} NFT Transaction for #: ${nftData.index}`);
            const nft_meta = await fetchMeta(cType, nftWontonPower, nftData.index);
            return {
                type: NFT,
                nft_address: nftAddress.toString({ testOnly }),
                owner_address: nftData.owner.toString({ testOnly }),
                nft_index: nftData.index,
                collection_type: cType,
                wonton_power: nftWontonPower,
                nft_meta,
                created_at: (tx.now * 1000).toString(),
            };
        }
    }

    return {
        type: NON_NFT,
    }
}

const fetchMeta = async (cType: CollectionType, wontonPower: number, nftIndex: number): Promise<NftMeta> => {
    const response = await axios.get(`https://simplemoves.github.io/wonton-nft/${cType}/${wontonPower}/meta-${nftIndex}.json`);
    return response.data;
}

export const checkNftOwner = async (nftAddress: Address, walletAddress: Address) => {
    // console.log(`ownerAddress: ${printJson(this.walletAddress)}`);
    // console.log(`Nft address: ${printJson(nftAddress)}`);
    // console.log(`Nft address is address: ${Address.isAddress(nftAddress)}`);
    // console.log(printJson(nftAddress));
    const nft = await getNftDataOrUndefined(nftAddress);
    // console.log(`Nft's owner address: ${nftAddress?.toString({ testOnly })}`);
    // console.log(`Wallet address: ${this.walletAddress?.toString({ testOnly })}`);
    // console.log(`this.walletAddress.equals(nft.owner): ${this.walletAddress.equals(nft.owner)}`);
    const ownershipApproved = !nft!! || walletAddress.equals(nft.owner);
    return {
        ownershipApproved,
        owner: ownershipApproved ? walletAddress : nft.owner,
    };
}

const getNftData = async (nftAddress: Address) => {
    const tonClient = await wonTonClientProvider.wonTonClient();
    const { stack } = await tonClient.runMethod(nftAddress, "get_nft_data");
    const inited = stack.readBoolean();
    const index = stack.readNumber();
    const collection = stack.readAddress();
    const owner = stack.readAddress();

    return {
        inited,
        index,
        collection,
        owner,
    };
}

const tryRequestTransactionList = async (walletAddress: Address, hash?: string, lt?: string, limit: number = 20) =>
    tryNTimes(async () => requestTransactionList(walletAddress, hash, lt, limit), 5, 500);

const getNftDataOrUndefined = async (nftAddress: Address) => {
    try {
        return getNftData(nftAddress);
    } catch (error) {
        console.warn(`Get NFT Data failed with: ${getErrorMessage(error)}`);
    }

    return undefined;
}

const tryGetNftData = async (nftAddress: Address) =>
    tryNTimes(() => getNftData(nftAddress), 5, 500);

