import { useCallback } from "react";
import { Address } from "@ton/core";
import { useNftsStore } from "../store/NftsStore.ts";


export function useNftWatcher2(walletAddress: Address | undefined) {
    const nftStore = useNftsStore();

    const handleUpdate = useCallback(() => {
        if (walletAddress) {
            console.log(`${new Date().getTime()} | Polling nfts...`);
            nftStore.poll(walletAddress).then( () => {
                nftStore.updateNftOwner(walletAddress).then(() => {
                    console.log(`${new Date().getTime()} | Finished polling nfts, and updating owners...`);
                })
            });
        } else {
            console.log("No wallet address or polling interval");
        }
    }, [ walletAddress ]);

    return {
        handleUpdate
    }
}
