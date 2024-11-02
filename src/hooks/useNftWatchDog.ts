import { WonTonNftWatchDog } from "../workers/WonTonNftWatchDog.ts";
import { Address } from "@ton/ton";
import { useEffect, useState } from "react";
// import { useNftsStore } from "../store/NftsStore.ts";

export function useNftWatchDog(walletAddress: Address | undefined) {
    // console.log(`walletAddress: ${walletAddress?.toString({testOnly: true})}`)
    // const getStore = () => useNftsStore(walletAddress)();
    const [nftWatcher, setNftWatcher] = useState<WonTonNftWatchDog | undefined>();

    useEffect(() => {
        if (walletAddress) {
            console.log("Start nft watcher");
            setNftWatcher(new WonTonNftWatchDog(walletAddress));

            return () => {
                setNftWatcher(undefined);
            };
        }
    }, [walletAddress]);

    return nftWatcher;
}