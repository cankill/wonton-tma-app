/* eslint-disable no-restricted-globals */

import { Transaction } from "@ton/ton";
import { Address } from '@ton/core'
import { CollectionInfo, FeGetNftData, FOUND, GetNftData, isNft, isNftData, NFT, Nft, NftMeta, NftStore, NonNft, NOT_NFT } from "@wonton-lib/Types.ts";
import { isTonAddress, possiblyNftTransfer } from "@wonton-lib/TonUtils.ts";
import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
import axios from "axios";
import { tryNTimes } from "@wonton-lib/PromisUtils.ts";
// import { testOnly } from "../store/NftsStore.ts";
import { globalUniversesHolder } from "../store/GlobalUniversesHolder.ts";
import { testOnly } from "../store/NftsStore.ts";
import { getErrorMessage } from "@wonton-lib/ErrorHandler.ts";
// import { getErrorMessage } from "../../modules/wonton-lib-common/src/ErrorHandler.ts";

// const nftItemCode = import.meta.env.VITE_NFT_ITEM_CODE;

export const digForNewNfts = async (walletAddress: Address,
    walletAddressStr: string,
    get: () => NftStore) => {
    try {
        await readTransactions(walletAddress, walletAddressStr, get);
    } catch (ex) {
        // @ts-ignore
        console.error(ex.message)
        // @ts-ignore
        console.error(ex.stackTrace)
    }
}

const readTransactions = async (walletAddress: Address,
    walletAddressStr: string,
    get: () => NftStore) => {
    const haveNotProcessed = get().anyNotProcessedTransactions(walletAddressStr);

    const innerRead = async (hash?: string, lt?: string, limit: number = 30) => {
        const newTransactions = await tryRequestTransactionList(walletAddress, hash, lt, limit);
        console.log(`Received ${newTransactions?.length} transactions`);
        if (!newTransactions) { return; }

        const hitBottom = newTransactions.length == 0 || newTransactions.length < limit;
        const processResult = await processTransactions(walletAddress, walletAddressStr, newTransactions, haveNotProcessed, get);
        if ((hitBottom || processResult.hitBottom) && !haveNotProcessed) { return; }
        return await innerRead(processResult.lastHash, processResult.lastLt);
    }

    await innerRead();
}

const processTransactions = async (walletAddress: Address,
    walletAddressStr: string,
    receivedTransactions: Transaction[],
    haveNotProcessed: boolean,
    get: () => NftStore) => {
    let hitBottom: boolean = false;
    let lastHash: string | undefined;
    let lastLt: string | undefined;

    for (const tx of receivedTransactions) {
        const txHash = tx.hash().toString("base64");
        lastHash = txHash;
        lastLt = tx.lt.toString();

        if (!get().isTransactionProcessed(walletAddressStr, txHash)) {
            get().addTransaction(walletAddressStr, { hash: txHash, lt: tx.lt, now: tx.now, state: FOUND });
            // console.log(`Found unprocessed transaction: ${txHash}, tx.now: ${new Date(tx.now * 1000).toISOString()}`);
            const success = await handleWalletInTxs(walletAddress, walletAddressStr, tx, get);
            if (success) {
                get().markTransactionAsProcessed(walletAddressStr, txHash);
            }
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
    tx: Transaction,
    get: () => NftStore): Promise<boolean> => {
    const inMsg = tx.inMessage;
    const nftAddress = inMsg?.info.src;
    if (isTonAddress(nftAddress) && possiblyNftTransfer(inMsg)) {
        // console.log(`Possibly NFT found: ${nftAddress}`);
        const nftData = await tryGetNftData(nftAddress);
        if (!nftData) {
            console.log(`No nft data loaded`);
            return false;
        }

        if(!isNftData(nftData.getNftData)) {
            return true;
        }

        const nft = await handleTx(nftAddress, walletAddress, walletAddressStr, tx, nftData.getNftData, get);
        if (!nft) {
            console.log(`No nft meta data loaded`);
            return false;
        }

        if (isNft(nft)) {
            get().addNft(walletAddressStr, nft);
        }
    }

    return true;
}

const handleTx = async (
    nftAddress: Address,
    walletAddress: Address,
    walletAddressStr: string,
    tx: Transaction,
    nftData: GetNftData,
    get: () => NftStore): Promise<Nft | NonNft | undefined> => {

    // console.log(`wallet address: ${walletAddressStr}`);
    // console.log(`nftData.owner: ${nftData.owner.toString({ testOnly })}`);
    // console.log(`nftData.collection: ${nftData.collection.toString({ testOnly })}`);
    if (walletAddress.equals(nftData.owner)) {
        const collectionInfo = globalUniversesHolder.collections[nftData.collection.toRawString()];
        if (collectionInfo) {
            if (!get().doesNftExists(walletAddressStr, collectionInfo, nftData.index)) {
                console.log(`wontonPower: ${collectionInfo.wonTonPower} | Found new ${collectionInfo.cType} NFT Transaction for #: ${nftData.index}`);
                const nft_meta = await fetchMeta(collectionInfo, nftData.index);
                return nft_meta ? {
                    type: NFT,
                    nft_address: nftAddress.toRawString(),
                    owner_address: nftData.owner.toRawString(),
                    nft_index: nftData.index,
                    collection_type: collectionInfo.cType,
                    wonton_power: collectionInfo.wonTonPower,
                    nft_meta,
                    created_at: (tx.now * 1000).toString(),
                }
                : NOT_NFT;
            }
        }
    }

    return NOT_NFT;
}

const fetchMeta = async (cInfo: CollectionInfo, nftIndex: number): Promise<NftMeta | undefined> => {
    try {
        const response = await axios.get(`https://simplemoves.github.io/wontopia-nft/${cInfo.cType}/${cInfo.wonTonPower}/meta-${nftIndex}.json`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching meta. cType: ${cInfo.cType}, wonTonPower: ${cInfo.wonTonPower}, index: ${nftIndex}`);
        return undefined;
    }
}

export const checkNftOwner = async (nftAddress: Address, walletAddress: Address) => {
    // console.log(`ownerAddress: ${printJson(this.walletAddress)}`);
    // console.log(`Nft address: ${printJson(nftAddress)}`);
    // console.log(`Nft address is address: ${Address.isAddress(nftAddress)}`);
    // console.log(printJson(nftAddress));
    const nft = await getNftData(nftAddress);
    // console.log(`Nft's owner address: ${nftAddress?.toString({ testOnly })}`);
    // console.log(`Wallet address: ${this.walletAddress?.toString({ testOnly })}`);
    // console.log(`this.walletAddress.equals(nft.owner): ${this.walletAddress.equals(nft.owner)}`);
    const ownershipApproved = !nft!! ||
                              (isNftData(nft?.getNftData) && walletAddress.equals(nft?.getNftData.owner));
    return {
        ownershipApproved,
        owner: ownershipApproved ? walletAddress : nft?.getNftData?.owner,
    };
}

const getNftData = async (nftAddress: Address): Promise<FeGetNftData | undefined> => {
    console.log(`Getting NFT data for address: ${nftAddress.toString({testOnly})}`);
    const tonClient = await wonTonClientProvider.wonTonClient();

    try {
        const { stack, exit_code } = await tonClient.runMethodWithError(nftAddress, "get_nft_data");
        console.log(`Got NFT data for address: ${nftAddress.toString({ testOnly })}, exit_code: ${exit_code}`);
        if (exit_code != 0) {
            console.log(`Get NFT data with address: ${nftAddress.toString({ testOnly })} failed with error: ${exit_code}`);
            console.log(`NFT with address: ${nftAddress.toString({ testOnly })} probably removed`);
            return {};
        }
        const inited = stack.readBoolean();
        const index = stack.readNumber();
        const collection = stack.readAddress();
        const owner = stack.readAddress();

        return {
            getNftData: {
                inited,
                index,
                collection,
                owner,
            }
        };
    } catch (error) {
        console.error(getErrorMessage(error))
    }
}

const tryRequestTransactionList = async (walletAddress: Address, hash?: string, lt?: string, limit: number = 20) =>
    tryNTimes(async () => requestTransactionList(walletAddress, hash, lt, limit), 5, 500);

const tryGetNftData = async (nftAddress: Address) =>
    tryNTimes(() => getNftData(nftAddress), 5, 500);

