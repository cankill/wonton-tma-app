/* eslint-disable no-restricted-globals */

import { Address } from "@ton/ton";
import { CollectionType, NftsHistory, TransactionHistory } from "../../modules/wonton-lib-common/src/Types";
import { getRandomInt } from "../../modules/wonton-lib-common/src/RandomUtils";

interface WatchDogCallbackType { (): void }

export class NftWatchDogTmp {
    readonly POLL_TIMEOUT: number = 5000 + getRandomInt(500);
    private readonly wonTonPower: number;
    private readonly cType: CollectionType;
    private readonly collectionAddress: Address;
    private readonly walletAddress: Address;
    private readonly foundNewNftCallBack: WatchDogCallbackType;


    transactions: TransactionHistory = {};
    readonly nfts: NftsHistory = {}

    constructor(nfts: NftsHistory, transactions: TransactionHistory, wonTonPower: number, cType: CollectionType, collectionAddress: Address, walletAddress: Address, foundNewNftCallBack: WatchDogCallbackType) {        
        this.nfts = nfts;
        this.transactions = transactions;
        this.wonTonPower = wonTonPower;
        this.cType = cType;
        this.collectionAddress = collectionAddress;
        this.walletAddress = walletAddress;
        this.foundNewNftCallBack = foundNewNftCallBack;
    }
}
