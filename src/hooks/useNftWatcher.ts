import { useEffect, useState } from "react";
import { useNftWatchDog } from "./useNftWatchDog.ts";
import { getRandomInt } from "../../modules/wonton-lib-common/src/RandomUtils.ts";
import { Address } from "@ton/core";
import { useVisibilityChange } from "./useVisibilityChange.ts";
import { useInterval } from "./useInterval.ts";

export const POLLING_INTERVAL: number = 5000 + getRandomInt(1000);
const digDepthHours = import.meta.env.VITE_DIG_DEPTH_HOURS || 24;

export function useNftWatcher(walletAddress: Address | undefined) {
    const [ pollingInterval, setPollingInterval ] = useState<number | undefined>(POLLING_INTERVAL);
    const isPageVisible = useVisibilityChange();
    const nftWatcher = useNftWatchDog(walletAddress);

    useEffect(() => {
        if (isPageVisible && nftWatcher) {
            setPollingInterval(POLLING_INTERVAL);
        } else {
            setPollingInterval(undefined);
        }
    }, [ isPageVisible, nftWatcher ]);

    useInterval(async () => {
        // console.log("Polling nfts...")
        await nftWatcher?.poll();
        this.cleanOldRecords(digDepthHours);
    }, pollingInterval);
}