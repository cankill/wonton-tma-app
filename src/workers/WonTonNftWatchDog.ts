/* eslint-disable no-restricted-globals */

import { Address } from "@ton/ton";
import { NftWatchDog } from "./NftWatchDog";
import { isNftWatcherCommand, isNftWatcherPong, NftsEvent } from "../../modules/wonton-lib-common/src/Types";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
import { NftWatchDogTmp } from "./NftWatchDogTmp";

const wontonPower = 1;
const win_nft_contract_str = import.meta.env.VITE_WIN_NFT_COLLECTION_ADDRESS;
const loose_nft_contract_str = import.meta.env.VITE_LOOSE_NFT_COLLECTION_ADDRESS;

const winCollectionAddress = Address.parse(win_nft_contract_str);
const looseCollectionAddress = Address.parse(loose_nft_contract_str);

var huiWatchdog: NftWatchDogTmp | undefined;
var winWatchdog: NftWatchDog | undefined;
var looseWatchdog: NftWatchDog | undefined;
var pingTimeoutHandlerPromise: Promise<void> | undefined;
var lastPingTime: number = 0;

// const pingTimeoutHandler = async () => {
//     await wait(20000);
//     const timeDiff = new Date().getTime() - lastPingTime;
//     if (timeDiff < 20000) {
//         console.log(`Ping received from parent process in ${timeDiff} [ms]`);
//         await pingTimeoutHandler();
//     }

//     console.log(`No ping from parent process for ${timeDiff} [ms], stopping`);
//     if (winWatchdog) { winWatchdog.stop(); }
//     if (looseWatchdog) { looseWatchdog.stop(); }
//     self.close();
// }

self.onmessage = (event: any) => {
    console.log(`Received new event: ${JSON.stringify(event.data)}`);
    // if (isNftWatcherPong(event.data)) {
    //     winWatchdog
    // }


    if (!isNftWatcherCommand(event.data)) { return; }

    const cmd = event.data;
    const walletAddress = Address.parse(cmd.walletAddressStr);
    console.log(`winWatchdog: ${winWatchdog}, looseWatchdog: ${looseWatchdog}`);
    if (!winWatchdog) {
        console.log("Win NFT searching loop started...");
        huiWatchdog = new NftWatchDogTmp(cmd.winNfts, cmd.winTransactions, wontonPower, "WIN", winCollectionAddress, walletAddress, onNewWinNft);
    } else {
        console.error("Win NFT searching loop is already running");
    }

    // if (!looseWatchdog) {
    //     console.log("Loose NFT searching loop started...");
    //     looseWatchdog = new NftWatchDog(cmd.looseNfts, cmd.looseTransactions, wontonPower, "LOOSE", looseCollectionAddress, walletAddress, onNewLooseNft);
    // } else {
    //     console.error("Loose NFT searching loop is already running");
    // }
}

const onNewWinNft = () => {
    if (winWatchdog) {
        const message: NftsEvent = { universe: "WIN", nfts: winWatchdog.nfts, transactions: winWatchdog.transactions }
        console.log("Sending win event: ", JSON.stringify(message));
        self.postMessage(message);
    }
}

const onNewLooseNft = () => {
    if (looseWatchdog) {
        const message: NftsEvent = { universe: "LOOSE", nfts: looseWatchdog.nfts, transactions: looseWatchdog.transactions }
        console.log("Sending loose event: ", JSON.stringify(message));
        self.postMessage(message);
    }
}

// pingTimeoutHandlerPromise = pingTimeoutHandler();
export {}