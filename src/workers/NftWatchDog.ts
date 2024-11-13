// /* eslint-disable no-restricted-globals */
//
// import { Transaction } from "@ton/ton";
// import { Address } from '@ton/core'
// import { CollectionType, FOUND, isNft, NFT, Nft, NftMeta, NftsHistory, NON_NFT, NonNft, PlainNftStore, SimpleTransactionHistory } from "@wonton-lib/Types.ts";
// import { isAddress, possiblyNftTransfer } from "@wonton-lib/TonUtils.ts";
// import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
// import axios from "axios";
// import { addNft, addTransaction, anyNotProcessesTransactions, doesNftExists, doesTransactionStored, markTransactionAsProcessed, testOnly, transactionStatusFound } from "../store/NftsStore.ts";
// import { tryNTimes } from "@wonton-lib/PromisUtils.ts";
// // import { getErrorMessage } from "../../modules/wonton-lib-common/src/ErrorHandler.ts";
//
// // const nftItemCode = import.meta.env.VITE_NFT_ITEM_CODE;
//
// export class NftWatchDog {
//     readonly wonTonPower: number;
//     readonly cType: CollectionType;
//     readonly collectionAddress: Address;
//     readonly walletAddress: Address;
//
//     constructor(wonTonPower: number,
//                 cType: CollectionType,
//                 collectionAddress: Address,
//                 walletAddress: Address) {
//         this.wonTonPower = wonTonPower;
//         this.cType = cType;
//         this.collectionAddress = collectionAddress;
//         this.walletAddress = walletAddress;
//     }
//
//     digForNewNfts = async (nftStore: PlainNftStore): Promise<PlainNftStore> => {
//         try {
//             const haveNotProcessed = anyNotProcessesTransactions(nftStore.transactions);
//             return  await this.readTransactions(nftStore, haveNotProcessed);
//         } catch (ex) {
//             // @ts-ignore
//             console.error(ex.message)
//             // @ts-ignore
//             console.error(ex.stackTrace)
//             return nftStore;
//         }
//     }
//
//     updateNftsOwner = async (nftStore: PlainNftStore): Promise<PlainNftStore> => {
//         try {
//             console.log(`updateNftsOwner`);
//             const newNfts = await this.updateNfts(nftStore.nfts);
//             return {
//                 transactions: nftStore.transactions,
//                 nfts: newNfts
//             }
//         } catch (ex) {
//             // @ts-ignore
//             console.error(ex.message)
//         }
//
//         return nftStore;
//     }
//
//     private readTransactions = async (store: PlainNftStore, haveNotProcessed: boolean, hash?: string, lt?: string, limit: number = 3): Promise<PlainNftStore> => {
//         const receivedTransactions = await this.tryRequestTransactionList(hash, lt, limit);
//         if (!receivedTransactions) {
//             return store;
//         }
//
//         const hitBottom = receivedTransactions.length == 0 || receivedTransactions.length < limit;
//         const processResult = await this.processTransactions(receivedTransactions, store.transactions, store.nfts, haveNotProcessed);
//         if (hitBottom || processResult.hitBottom && !haveNotProcessed) {
//             return processResult.store;
//         }
//
//         return await this.readTransactions(processResult.store, haveNotProcessed, processResult.lastHash, processResult.lastLt);
//     }
//
//     private async processTransactions(receivedTransactions: Transaction[], transactions: SimpleTransactionHistory, nfts: NftsHistory, haveNotProcessed: boolean) {
//         let hitBottom: boolean = false;
//         let lastHash: string | undefined;
//         let lastLt: string | undefined;
//
//         for (const tx of receivedTransactions) {
//             const txHash = tx.hash().toString("base64");
//             if (!doesTransactionStored(txHash, transactions) || transactionStatusFound(txHash, transactions)) {
//                 transactions = addTransaction(txHash, { hash: txHash, lt: tx.lt, now: tx.now, state: FOUND }, transactions);
//                 // console.log(`Found new transaction: ${txHash}, tx.now: ${new Date(tx.now * 1000)}`);
//                 const newNft = await this.handleWalletInTxs(nfts, tx);
//
//                 if (newNft) {
//                     if (isNft(newNft)) {
//                         nfts = addNft(newNft, nfts);
//                     }
//
//                     transactions = markTransactionAsProcessed(txHash, transactions);
//                 }
//
//                 lastHash = txHash;
//                 lastLt = tx.lt.toString();
//             } else if (!haveNotProcessed) {
//                 hitBottom = true;
//                 break;
//             }
//         }
//         return { store: { transactions, nfts }, lastHash, lastLt, hitBottom };
//     }
//
//     private async requestTransactionList(hash?: string, lt?: string, limit: number = 20) {
//         const tonClient = await wonTonClientProvider.wonTonClient();
//         return await tonClient.getTransactions(this.walletAddress, { limit: limit, archival: true, inclusive: false, lt, hash });
//     }
//
//     private handleWalletInTxs = async (nfts: NftsHistory, tx: Transaction): Promise<Nft | NonNft | undefined> => {
//         const inMsg = tx.inMessage;
//         const nftAddress = inMsg?.info.src;
//         if (isAddress(nftAddress) && possiblyNftTransfer(inMsg)) {
//             const nftData = await this.tryGetNftData(nftAddress);
//             if (!nftData) {
//                 return undefined;
//             }
//             const nftWontonPower = this.wonTonPower + 1;
//             if (this.walletAddress.equals(nftData.owner) && this.collectionAddress.equals(nftData.collection)) {
//                 if (!doesNftExists(nfts, this.cType, nftWontonPower, nftData.index)) {
//                     console.log(`wontonPower: ${this.wonTonPower} | Found new ${this.cType} NFT Transaction for #: ${nftData.index}`);
//                     const nft_meta = await this.fetchMeta(nftWontonPower, nftData.index);
//                     return {
//                         type: NFT,
//                         nft_address: nftAddress,
//                         owner_address: nftData.owner.toString({ testOnly }),
//                         nft_index: nftData.index,
//                         collection_type: this.cType,
//                         wonton_power: nftWontonPower,
//                         nft_meta,
//                         created_at: (tx.now * 1000).toString(),
//                     };
//                 }
//             }
//         }
//
//         return {
//             type: NON_NFT
//         };
//     }
//
//     private fetchMeta = async (wontonPower: number, nftIndex: number): Promise<NftMeta> => {
//         const response = await axios.get(`https://simplemoves.github.io/wonton-nft/${this.cType}/${wontonPower}/meta-${nftIndex}.json`);
//         const meta: NftMeta = response.data
//         return meta;
//     }
//
//     private checkNftOwner = async (nftAddress: Address): Promise<boolean> => {
//         // console.log(`ownerAddress: ${printJson(this.walletAddress)}`);
//         // console.log(`Nft address: ${printJson(nftAddress)}`);
//         // console.log(`Nft address is address: ${Address.isAddress(nftAddress)}`);
//         // console.log(`Checking for the owner Nft address: ${nftAddress?.toString({ testOnly })}`);
//         const nft = await this.tryGetNftData(nftAddress);
//         // console.log(`Nft's owner address: ${nftAddress?.toString({ testOnly })}`);
//         // console.log(`Wallet address: ${this.walletAddress?.toString({ testOnly })}`);
//         // console.log(`this.walletAddress.equals(nft.owner): ${this.walletAddress.equals(nft.owner)}`);
//         return nft!! && this.walletAddress.equals(nft.owner);
//     }
//
//     private getNftData = async (nftAddress: Address) => {
//         const tonClient = await wonTonClientProvider.wonTonClient();
//         const { stack } = await tonClient.runMethod(nftAddress, "get_nft_data");
//         const inited = stack.readBoolean();
//         const index = stack.readNumber();
//         const collection = stack.readAddress();
//         const owner = stack.readAddress();
//
//         return {
//             inited,
//             index,
//             collection,
//             owner,
//         };
//     }
//
//     private updateNfts = async (nfts: NftsHistory): Promise<NftsHistory> => {
//         let newNfts: NftsHistory = {};
//         for(const nftKey of Object.keys(nfts)) {
//             const nft = nfts[nftKey];
//             // console.log(printJson(nft));
//             if (await this.checkNftOwner(nft.nft_address)) {
//                 newNfts[nftKey] = nft;
//             } else {
//                 console.log(`Delete transferred nft: ${nftKey}`);
//             }
//         }
//
//         return newNfts;
//     }
//
//     private tryRequestTransactionList = async(hash?: string, lt?: string, limit: number = 20) =>
//         tryNTimes(async () => this.requestTransactionList(hash, lt, limit), 5, 500);
//     private tryGetNftData = async (nftAddress: Address) =>
//         tryNTimes(() => this.getNftData(nftAddress), 5, 500);
//
//     dump = (): String => `NftWatchDog(wontonPower: ${this.wonTonPower}, ` +
//                          `cType: ${this.cType}, ` +
//                          `collectionAddress: ${this.collectionAddress.toString({ testOnly })}, ` +
//                          `walletAddress: ${this.walletAddress.toString({ testOnly })})`;
// }
