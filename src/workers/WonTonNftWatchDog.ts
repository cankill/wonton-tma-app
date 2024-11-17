// /* eslint-disable no-restricted-globals */
//
// import { Address } from "@ton/ton";
// import { NftWatchDog } from "./NftWatchDog";
// import { globalUniversesHolder } from "../store/NftsStore.ts";
// import { PlainNftStore } from "@wonton-lib/Types.ts";
//
// export class WonTonNftWatchDog {
//     private readonly watchdogs: NftWatchDog[] = [];
//
//     constructor(walletAddress: Address) {
//         this.watchdogs = Object.values(globalUniversesHolder).flatMap(universes => {
//             return [
//                 new NftWatchDog(universes.wonTonPower, "WIN", universes.winUniverse.collection, walletAddress),
//                 new NftWatchDog(universes.wonTonPower, "LOOSE", universes.looseUniverse.collection, walletAddress),
//             ];
//         })
//     }
//
//     poll = async (nftStore: PlainNftStore): Promise<PlainNftStore> => {
//         let newNftStore = nftStore;
//         for (const watchDog of this.watchdogs) {
//             newNftStore = await watchDog.digForNewNfts(newNftStore);
//             newNftStore = await watchDog.updateNftsOwner(newNftStore);
//         }
//
//         return newNftStore;
//     }
// }
