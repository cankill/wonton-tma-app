/* eslint-disable no-restricted-globals */

import { Address } from "@ton/ton";
import { NftWatchDog } from "./NftWatchDog";
import { globalUniversesHolder } from "../store/NftsStore.ts";
import { NftsHistory, TransactionHistory } from "../../modules/wonton-lib-common/src/Types.ts";

export class WonTonNftWatchDog {
    private readonly watchdogs: NftWatchDog[] = [];

    constructor(walletAddress: Address) {
        this.watchdogs = Object.values(globalUniversesHolder).flatMap(universes => {
            return [
                new NftWatchDog(universes.wonTonPower, "WIN", universes.winUniverse.collection, walletAddress),
                new NftWatchDog(universes.wonTonPower, "LOOSE", universes.looseUniverse.collection, walletAddress),
            ];
        })
    }

    poll = async ({ transactions, nfts }: { transactions: TransactionHistory, nfts: NftsHistory }) => {
        for (const watchDog of this.watchdogs) {
            await watchDog.digForNewNfts(transactions, nfts);
            // await watchDog.updateNftsOwner();
        }
    }
}
