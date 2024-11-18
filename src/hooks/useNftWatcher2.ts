import { useCallback, useState } from "react";
import { Address } from "@ton/core";
import { useNftsStore } from "../store/NftsStore.ts";
import { getErrorMessage } from "@wonton-lib/ErrorHandler.ts";

export function useNftWatcher2(walletAddress: Address | undefined) {
    const nftStore = useNftsStore();
    const [ running, setRunning ] = useState(false);

    const handleUpdate = useCallback(() => {
        if (running) {
            console.log(`${new Date().getTime()} | Polling nfts is in progress...`);
            return;
        }

        if (walletAddress) {
            setRunning(_ => true);
            try {
                console.log(`${new Date().getTime()} | Polling nfts... ${running}`);
                nftStore.poll(walletAddress).then(() => {
                    nftStore.updateNftOwner(walletAddress).then(() => {
                        console.log(`${new Date().getTime()} | Finished polling nfts, and updating owners...`);
                        setRunning(_ => false);
                    })
                });
            } catch (error) {
                console.error(`${new Date().getTime()} | Polling nfts failed with error: ${getErrorMessage(error)}`);
                setRunning(_ => false);
            }
        } else {
            console.log("No wallet address or polling interval");
        }
    }, [ walletAddress, nftStore, running, setRunning ]);

    return {
        handleUpdate
    }
}
