/* eslint-disable no-restricted-globals */

import { Address, Message } from "@ton/ton";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
import { CollectionType, NftsHistory, NftStore, TransactionHistory } from "../../modules/wonton-lib-common/src/Types";
import { bigIntToBase64 } from "../../modules/wonton-lib-common/src/Base64Utils";
import { isTransactionFresh, msgHash, parseNftItemBody } from "../../modules/wonton-lib-common/src/TonUtils";
import { wonTonClient } from "./WonTonClient";

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
            console.error(ex);
        }
    };
    
    private async readTransactions() {
        const client = await wonTonClient();
        const state = await client.getContractState(this.collectionAddress);
        if (!(state && state.lastTransaction)) { return; }
        const {lt, hash} = state.lastTransaction;
        console.log(`${this.cType}: Found starting state: {${lt}, ${hash}}, let's dig`);
        await this.dig(lt, hash);
    }
    
    private async dig(lt: string, hash: string) {      
        const client = await wonTonClient();
        const tx = await client.getTransaction(this.collectionAddress, lt, hash);
        console.log(`${this.cType}: Found tx: ${JSON.stringify(tx, null, "")}`);
        if (tx && isTransactionFresh(tx, new Date(), digDepthHours) && tx.outMessages?.size > 0) {
            const outMessages = tx.outMessages.values();
            console.log(`${this.cType}: Found NFT Collection out messages`);
            for (const message of outMessages) {
                const outMsgHash = msgHash(message);
                if (! (outMsgHash in this.nftStore.transactions)) {                
                    console.log(`${this.cType}: Found new NFT collection out message: ${outMsgHash}`);
                    await this.handleNftCollectionOutMesssage(message);
                    
                    this.nftStore.addTransaction(outMsgHash, { now: tx.now });
                    
                    const prevTransLt = tx.prevTransactionLt;
                    const prevHash = bigIntToBase64(tx.prevTransactionHash);
                    if (prevTransLt > 0) {
                        await this.dig(prevTransLt.toString(), prevHash);
                    }
                }                    
            }            
        }
    }
    
    private async handleNftCollectionOutMesssage(message: Message) {
        if (message.info.dest instanceof Address) {
            const { ownerAddress, metaUrl, nftIndex } = parseNftItemBody(message.body);
            if (ownerAddress.equals(this.walletAddress)) {
                if (nftIndex && this.nftStore.doesNftExists(this.cType, nftIndex)) {
                    console.log(`Found ${this.cType} NFT Transaction with id: ${nftIndex} and with meta url: ${metaUrl}`);
                    this.nftStore.addNft({
                        owner_address: ownerAddress.toString(),
                        nft_index: nftIndex,
                        collection_type: this.cType,
                        wonton_power: this.wonTonPower
                    });
                }                
            }
        }
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
