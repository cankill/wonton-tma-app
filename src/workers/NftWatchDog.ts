/* eslint-disable no-restricted-globals */

import { Transaction } from "@ton/ton";
import { Address } from '@ton/core'
import { AddNftFunction, AddTransactionFunction, CheckNftOwner, CleanOldRecords, CleanOldRecordsSchema, CollectionType, DoesTransactionStored, Nft, NftFilteringFunction, NftMeta, NftsHistory, NftStore, SimpleTransactionHistory, TransactionHistory } from "../../modules/wonton-lib-common/src/Types";
import { isAddress, isNftTransfer, isTransactionFresh } from "../../modules/wonton-lib-common/src/TonUtils";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
import axios from "axios";
import { addTransaction, doesTransactionStored, testOnly } from "../store/NftsStore.ts";
import { tryNTimes } from "../../modules/wonton-lib-common/src/PromisUtils.ts";
import { printJson } from "../../modules/wonton-lib-common/src/ErrorHandler.ts";
// import { getErrorMessage } from "../../modules/wonton-lib-common/src/ErrorHandler.ts";

// const nftItemCode = import.meta.env.VITE_NFT_ITEM_CODE;

export class NftWatchDog {
    readonly wonTonPower: number;
    readonly cType: CollectionType;
    readonly collectionAddress: Address;
    readonly walletAddress: Address;

    constructor(wonTonPower: number,
                cType: CollectionType,
                collectionAddress: Address,
                walletAddress: Address) {
        this.wonTonPower = wonTonPower;
        this.cType = cType;
        this.collectionAddress = collectionAddress;
        this.walletAddress = walletAddress;
    }

    digForNewNfts = async (store: { transactions: TransactionHistory, nfts: NftsHistory }) => {
        try {
            await this.readTransactions(store);
        } catch (ex) {
            // @ts-ignore
            console.error(ex.message)
            // @ts-ignore
            console.error(ex.stackTrace)
        }
    }

    updateNftsOwner = async () => {
        try {
            console.log(`updateNftsOwner`);
            await this.updateNfts();
        } catch (ex) {
            // @ts-ignore
            console.error(ex.message)
        }
    }

    private readTransactions = async (store: { transactions: SimpleTransactionHistory, nfts: NftsHistory }, hash?: string, lt?: string, limit: number = 3): Promise<{ transactions: SimpleTransactionHistory, nfts: NftsHistory }> => {
        const txs = await tryNTimes(async () => this.requestTransactionList(hash, lt, limit), 3, 500);
        // const freshTxs = txs.filter(tx => tx && isTransactionFresh(tx, new Date(), digDepthHours));
        let hitBottom = txs.length == 0 || txs.length < limit;
        let lastHash: string | undefined;
        let lastLt: string | undefined;

        let transactions = store.transactions;
        let nfts = store.nfts;
        for (const tx of txs) {
            const txHash = tx.hash().toString("base64");
            if (!doesTransactionStored(transactions, txHash)) {
                // console.log(`Found new transaction: ${txHash}, tx.now: ${new Date(tx.now * 1000)}`);
                nfts = await this.handleWalletInTxs(nfts, tx);
                transactions = addTransaction(txHash, { hash: txHash, lt: tx.lt, now: tx.now }, transactions);
                lastHash = txHash;
                lastLt = tx.lt.toString();
            } else {
                hitBottom = true;
            }
        }

        if (!hitBottom) {
            return await this.readTransactions({ transactions, nfts }, lastHash, lastLt);
        }

        return { transactions, nfts };
    }

    private async requestTransactionList(hash?: string, lt?: string, limit: number = 20) {
        const tonClient = await wonTonClientProvider.wonTonClient();
        return await tonClient.getTransactions(this.walletAddress, { limit: limit, archival: true, inclusive: false, lt, hash });
    }

    private handleWalletInTxs = async (nfts: NftsHistory, tx: Transaction): Promise<NftsHistory> => {
        const inMsg = tx.inMessage;
        const nftAddress = inMsg?.info.src;
        if (isAddress(nftAddress) && isNftTransfer(inMsg, this.collectionAddress)) {
            const nftData = await tryNTimes(() => this.getNftData(nftAddress), 3, 500);
            const nftWontonPower = this.wonTonPower + 1;
            if (this.walletAddress.equals(nftData.owner)) {
                if (!this.doesNftExists(this.cType, nftWontonPower, nftData.index)) {
                    console.log(`wontonPower: ${this.wonTonPower} | Found new ${this.cType} NFT Transaction for #: ${nftData.index}`);
                    const nft_meta = await this.fetchMeta(nftWontonPower, nftData.index);
                    const newNft: Nft = {
                        nftAddress: nftAddress,
                        owner_address: nftData.owner.toString({ testOnly }),
                        nft_index: nftData.index,
                        collection_type: this.cType,
                        wonton_power: nftWontonPower,
                        nft_meta,
                        created_at: (tx.now * 1000).toString(),
                    };

                    this.addNft(newNft);
                }
            }
        }
    }

    private fetchMeta = async (wontonPower: number, nftIndex: number): Promise<NftMeta> => {
        const response = await axios.get(`https://simplemoves.github.io/wonton-nft/${this.cType}/${wontonPower}/meta-${nftIndex}.json`);
        const meta: NftMeta = response.data
        return meta;
    }

    private checkNftOwner = async (nftAddress: Address): Promise<boolean> => {
        // console.log(`ownerAddress: ${printJson(this.walletAddress)}`);
        // console.log(`Nft address: ${printJson(nftAddress)}`);
        // console.log(`Nft address is address: ${Address.isAddress(nftAddress)}`);
        // console.log(`Checking for the owner Nft address: ${nftAddress?.toString({ testOnly })}`);
        const nft = await tryNTimes(() => this.getNftData(nftAddress), 3, 500);
        // console.log(`Nft's owner address: ${nftAddress?.toString({ testOnly })}`);
        // console.log(`Wallet address: ${this.walletAddress?.toString({ testOnly })}`);
        // console.log(`this.walletAddress.equals(nft.owner): ${this.walletAddress.equals(nft.owner)}`);
        return this.walletAddress.equals(nft.owner);
    }

    private async getNftData(nftAddress: Address) {
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

    private updateNfts = async () => {
        Object.keys(this.nfts).forEach(nftKey => {
            const nft: Nft = this.nfts[nftKey];
            // console.log(printJson(nft));
            if (!this.checkNftOwner(nft.nftAddress)) {
                console.log(`Delete transferred nft: ${nftKey}`);
                this.nftStore.deleteNft(nftKey);
            }
        });
    }

    dump = (): String => `NftWatchDog(wontonPower: ${this.wonTonPower}, ` +
                         `cType: ${this.cType}, ` +
                         `collectionAddress: ${this.collectionAddress.toString({ testOnly })}, ` +
                         `walletAddress: ${this.walletAddress.toString({ testOnly })})`;
}
