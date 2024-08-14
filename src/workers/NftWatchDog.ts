/* eslint-disable no-restricted-globals */

import { Message, Transaction } from "@ton/ton";
import { Address } from '@ton/core'
import { CollectionType, NftMeta, NftStore } from "../../modules/wonton-lib-common/src/Types";
import { isTransactionFresh, parseNftItemBody, parseNftMetaBody } from "../../modules/wonton-lib-common/src/TonUtils";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
import axios from "axios";

const digDepthHours = import.meta.env.VITE_DIG_DEPTH_HOURS || 24;

export class NftWatchDog {
    private readonly wonTonPower: number;
    private readonly cType: CollectionType;
    private readonly collectionAddress: Address;
    private readonly walletAddress: Address;

    private readonly nftStore: NftStore;

    constructor(nftStore: NftStore, wonTonPower: number, cType: CollectionType, collectionAddress: Address, walletAddress: Address) {        
        this.nftStore = nftStore;
        this.wonTonPower = wonTonPower;
        this.cType = cType;
        this.collectionAddress = collectionAddress;
        this.walletAddress = walletAddress;        
    }

    async digForNewNfts() {
        try {
            await this.readTransactions();
            await this.cleanOldRecords();
        } catch (ex) {   
            var error = 'Unknown';
            if (typeof ex === "string") {
                error = ex.toUpperCase() // works, `e` narrowed to string
            } else if (ex instanceof Error) {
                error = ex.message // works, `e` narrowed to Error
            }
            console.error(ex);
            // console.error(`FAN: ${JSON.stringify(ex)}`);
            // console.error(`FAN: ${error}`);
        }
    };
    
    private async readTransactions(hash?: string, lt?: string, limit: number = 20) {
        const tonClient = await wonTonClientProvider.wonTonClient();
        const txs = await tonClient.getTransactions(this.collectionAddress, { limit: limit, archival: true, inclusive: false, lt, hash });
        const freshTxs = txs.filter(tx => tx && isTransactionFresh(tx, new Date(), digDepthHours));
        var hitBottom = freshTxs.length == 0 || freshTxs.length < limit;
        var lastHash: string|undefined;
        var lastLt: string|undefined; 

        for (const tx of freshTxs) {
            const txHash = tx.hash().toString("base64");
            if (!(txHash in this.nftStore.transactions)) {
                console.log(`Found new transaction: ${txHash}, tx.now: ${new Date(tx.now * 1000)}`);
                await this.handleNftContractInTx(tx);
                this.nftStore.addTransaction(txHash, { now: tx.now });
                lastHash = txHash;
                lastLt = tx.lt.toString();
            } else {
                hitBottom = true;
            }
        }
        
        if (! hitBottom) {
            await this.readTransactions(lastHash, lastLt);
        }
    }

    async handleNftContractInTx(tx: Transaction) {
        if (tx.inMessage && tx.inMessage.body.beginParse().remainingBits > 0) {
            console.log("handleNftContractInTx: 1");
            const { nftIndex, ownerAddress } = parseNftMetaBody(tx.inMessage);
            console.log(`handleNftContractInTx: 2; ownerAddress: ${ownerAddress}; this.walletAddress: ${this.walletAddress}`);
            if (this.walletAddress.equals(ownerAddress)) {
                console.log(`Found ${this.cType} NFT Transaction for #: ${nftIndex}`);
                if (!this.nftStore.doesNftExists(this.cType, nftIndex)) {
                    if(this.checkOutMessages(tx.outMessages.values())) {
                        const nft_meta = await this.fetchMeta(nftIndex);    
                        this.nftStore.addNft({
                            owner_address: ownerAddress.toString(),
                            nft_index: nftIndex,
                            collection_type: this.cType,
                            wonton_power: this.wonTonPower,
                            nft_meta
                        });
                    }
                }
            }
        }
    }

    private async fetchMeta(nftIndex: number): Promise<NftMeta> {
        const response = await axios.get(`https://simplemoves.github.io/wonton-nft/${this.cType}/meta-${nftIndex}.json`);
        const meta: NftMeta = response.data 
        return meta;
    }
    
    private checkOutMessages(messages?: Message[]): boolean {
        return messages ? messages.some(this.ensureNftIsGenerated.bind(this)) : false;
    }

    private ensureNftIsGenerated(message: Message): boolean {
        const { ownerAddress } = parseNftItemBody(message.body);
        return this.walletAddress.equals(ownerAddress);
    }
    
    private async cleanOldRecords() {
        const now = new Date();
        Object.keys(this.nftStore.transactions).forEach(txKey => {
            const tx = this.nftStore.transactions[txKey];
            if (!isTransactionFresh(tx, now, digDepthHours)) {
                console.log(`Delete old transaction hash: ${txKey}`);
                this.nftStore.deleteTransaction(txKey);
            }
        });
    }
}
