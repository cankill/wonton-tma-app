// /* eslint-disable no-restricted-globals */

// import { Address, Message } from "@ton/ton";
// import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
// import { CollectionType, NftsHistory, TransactionHistory } from "../../modules/wonton-lib-common/src/Types";
// import { bigIntToBase64 } from "../../modules/wonton-lib-common/src/Base64Utils";
// import { isTransactionFresh, msgHash, parseNftItemBody } from "../../modules/wonton-lib-common/src/TonUtils";
// import { getRandomInt } from "../../modules/wonton-lib-common/src/RandomUtils";
// import { wonTonClient } from "./WonTonClient";

// const digDepthHours = import.meta.env.VITE_DIG_DEPTH_HOURS || 24;

// interface WatchDogCallbackType { (): void }

// export class NftWatchDog {
//     readonly POLL_TIMEOUT: number = 5000 + getRandomInt(500);
//     private readonly wonTonPower: number;
//     private readonly cType: CollectionType;
//     private readonly collectionAddress: Address;
//     private readonly walletAddress: Address;
//     private readonly foundNewNftCallBack: WatchDogCallbackType;
//     private readonly inited: Promise<void>;
    
//     private isStopped = false;

//     transactions: TransactionHistory = {};
//     readonly nfts: NftsHistory = {}

//     constructor(nfts: NftsHistory, transactions: TransactionHistory, wonTonPower: number, cType: CollectionType, collectionAddress: Address, walletAddress: Address, foundNewNftCallBack: WatchDogCallbackType) {        
//         this.nfts = nfts;
//         this.transactions = transactions;
//         this.wonTonPower = wonTonPower;
//         this.cType = cType;
//         this.collectionAddress = collectionAddress;
//         this.walletAddress = walletAddress;
//         this.foundNewNftCallBack = foundNewNftCallBack;

//         // this.inited = this.init();
//     }

//     public stop() {
//         this.isStopped = true;
//     }

//     private async init() {
//         await this.waitForNewNfts();
//     }

//     private async waitForNewNfts() {            
//         await this.readTransactions();
//         await this.cleanOldRecords();
//         await wait(this.POLL_TIMEOUT);
//         if (!this.isStopped) {
//             await this.waitForNewNfts();
//         }
//         console.log(`${this.cType}: Watcher stopped`)
//     };
    
//     private async readTransactions() {
//         try {
//             const client = await wonTonClient();
//             const state = await client.getContractState(this.collectionAddress);
//             if (!(state && state.lastTransaction)) { return; }
//             const {lt, hash} = state.lastTransaction;
//             console.log(`${this.cType}: Found starting state: {${lt}, ${hash}}, let's dig`);
//             if (!this.isStopped) {
//                 await this.dig(lt, hash);
//             }
//         } catch (ex) {
//             console.error(ex);
//         }
//     }
    
//     private async dig(lt: string, hash: string) {      
//         const client = await wonTonClient();
//         const tx = await client.getTransaction(this.collectionAddress, lt, hash);
//         console.log(`${this.cType}: Found tx: ${JSON.stringify(tx, null, "")}`);
//         if (tx && isTransactionFresh(tx, new Date(), digDepthHours) && tx.outMessages?.size > 0) {
//             const outMessages = tx.outMessages.values();
//             console.log(`${this.cType}: Found NFT Collection out messages`);
//             for (const message of outMessages) {
//                 const outMsgHash = msgHash(message);
//                 if (! (outMsgHash in this.transactions)) {                
//                     console.log(`${this.cType}: Found new NFT collection out message: ${outMsgHash}`);
//                     await this.handleNftCollectionOutMesssage(message);
                    
//                     this.transactions[outMsgHash] = { now: tx.now }
                    
//                     const prevTransLt = tx.prevTransactionLt;
//                     const prevHash = bigIntToBase64(tx.prevTransactionHash);
//                     if (prevTransLt > 0 && !this.isStopped) {
//                         await this.dig(prevTransLt.toString(), prevHash);
//                     }
//                 }                    
//             }            
//         }
//     }
    
//     private async handleNftCollectionOutMesssage(message: Message) {
//         if (message.info.dest instanceof Address) {
//             const { ownerAddress, metaUrl, nftIndex } = parseNftItemBody(message.body);
//             if (ownerAddress.equals(this.walletAddress)) {
//                 if (nftIndex && !(nftIndex in this.nfts)) {
//                     console.log(`Found ${this.cType} NFT Transaction with id: ${nftIndex} and with meta url: ${metaUrl}`);
//                     this.nfts[nftIndex] = {
//                         owner_address: ownerAddress.toString(),
//                         nft_index: nftIndex,
//                         collection_type: this.cType,
//                         wonton_power: this.wonTonPower
//                     };
//                     this.foundNewNftCallBack();
//                 }                
//             }
//         }
//     }
    
//     private async cleanOldRecords() {
//         const now = new Date();
//         Object.keys(this.transactions).forEach(txKey => {
//                 const tx = this.transactions[txKey];
//                 if (!isTransactionFresh(tx, now, digDepthHours)) {
//                     console.log(`Delete old transaction hash: ${txKey}`);
//                     delete this.transactions[txKey];
//                 }
//         });
//     }
// }
