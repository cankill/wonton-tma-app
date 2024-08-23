import { WonTonNftWatchDog } from "../workers/WonTonNftWatchDog.ts";
import { useTonConnect } from "./useTonConnect.ts";
import { Address } from "@ton/ton";
import { useEffect, useState } from "react";
import { useNftsStore } from "../store/NftsStore.ts";

export function useNftWatchDog() {
    const nftStore = useNftsStore();
    const {connected, walletAddressStr} = useTonConnect();
    const [nftWatcher, setNftWatcher] = useState<WonTonNftWatchDog | undefined>();

    useEffect(() => {
        if (connected) {
            console.log("Start nft watcher");
            if (!nftWatcher && walletAddressStr) {
                setNftWatcher(new WonTonNftWatchDog(Address.parse(walletAddressStr), nftStore));
            }
        } else {
            console.log("Stop nft watcher");
            setNftWatcher(undefined);
            nftStore.clean();
        }
    }, [connected, walletAddressStr]);

    return nftWatcher;
}