import { useEffect, useState } from "react";
// import { useNftWatchDog } from "./useNftWatchDog.ts";
import { getRandomInt } from "@wonton-lib/RandomUtils.ts";
import { Address } from "@ton/core";
import { useVisibilityChange } from "./useVisibilityChange.ts";
import { useNftsStore } from "../store/NftsStore.ts";
import { wait } from "@wonton-lib/PromisUtils.ts";

export const POLLING_INTERVAL: number = 20 * 1000 + getRandomInt(1000);
// export const POLLING_INTERVAL: number = 10 * 60 * 1000 + getRandomInt(1000);
// const digDepthHours = import.meta.env.VITE_DIG_DEPTH_HOURS || 24;

export function useNftWatcher(walletAddress: Address | undefined) {
    const [ pollingInterval, setPollingInterval ] = useState<number | undefined>(POLLING_INTERVAL);
    const isPageVisible = useVisibilityChange();
    // const nftWatcher = useNftWatchDog(walletAddress);
    const nftStore = useNftsStore();

    useEffect(() => {
        if (isPageVisible) {
            setPollingInterval(POLLING_INTERVAL);
        } else {
            setPollingInterval(undefined);
        }
    }, [ isPageVisible ]);

    useEffect(() => {
        const poll = async () => {
            if (walletAddress && pollingInterval) {
                console.log("Polling nfts...");
                await nftStore.poll(walletAddress);
                console.log(`Polling nfts finished`);
                console.log("Checking nfts ownership change...");
                await nftStore.updateNftOwner(walletAddress);
                console.log(`Checking nfts ownership change finished`);
                // cleanOldRecordsRef.current(digDepthHours);
                await wait(pollingInterval);
                await poll();
            } else {
                console.log("No wallet address or polling interval");
            }
        }

        poll()
    }, [walletAddress, pollingInterval]);
}
