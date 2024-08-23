import { POLL_TIMEOUT } from "../workers/WonTonNftWatchDog.ts";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils.ts";
import { useEffect } from "react";
import { useNftWatchDog } from "./useNftWatchDog.ts";

export function useNftWatcher() {
    const nftWatcher = useNftWatchDog();
    useEffect(() => {
        if (nftWatcher) {
            const watch = async () => {
                if (nftWatcher) {
                    await nftWatcher.poll();
                    await wait(POLL_TIMEOUT);
                    await watch();
                }
            }

            watch();
        }
    }, [nftWatcher]);
}