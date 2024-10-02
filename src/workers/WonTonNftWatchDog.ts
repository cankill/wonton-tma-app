/* eslint-disable no-restricted-globals */

import { Address } from "@ton/ton";
import { NftWatchDog } from "./NftWatchDog";
import { NftStore} from "../../modules/wonton-lib-common/src/Types";
import { getRandomInt } from "../../modules/wonton-lib-common/src/RandomUtils";

export const POLL_TIMEOUT: number = 5000 + getRandomInt(500);

const wontonPower = 1;
const win_nft_contract_str = import.meta.env.VITE_WIN_NFT_COLLECTION_ADDRESS;
const loose_nft_contract_str = import.meta.env.VITE_LOOSE_NFT_COLLECTION_ADDRESS_0;

const winCollectionAddress = Address.parse(win_nft_contract_str);
const looseCollectionAddress = Address.parse(loose_nft_contract_str);

export class WonTonNftWatchDog {
    private readonly winWatchdog: NftWatchDog;
    private readonly looseWatchdog: NftWatchDog;

    constructor(walletAddress: Address, nftStore: NftStore) {
        this.winWatchdog = new NftWatchDog(nftStore , wontonPower, "WIN", winCollectionAddress, walletAddress);
        this.looseWatchdog = new NftWatchDog(nftStore, wontonPower, "LOOSE", looseCollectionAddress, walletAddress);
    }

    poll = async () => {
        await this.winWatchdog.digForNewNfts();
        await this.looseWatchdog.digForNewNfts();
    }
}
