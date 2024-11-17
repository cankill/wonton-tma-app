import { Address, toNano } from "@ton/core";
import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
import { NftItemData } from "@wonton-lib/Types.ts";
import { useCallback, useMemo } from "react";
import { useTonConnect } from "./useTonConnect.ts";
import { tryNTimes } from "@wonton-lib/PromisUtils.ts";
import { WonTonNftItemContract } from "@wonton-lib/contract-wrappers/WonTonNftItemContract.ts";

// import { testOnly } from "../store/NftsStore.ts";

export function useNftItemContract(nftItem: Address) {
    const contract = useMemo<WonTonNftItemContract>(() => WonTonNftItemContract.createFromAddress(nftItem), [ nftItem ]);
    const { sender } = useTonConnect();

    const openContract = useCallback(async (contract: WonTonNftItemContract) => {
        const client = await wonTonClientProvider.wonTonClient();
        return client.open(contract);
    }, [])

    const sendBetNft = useCallback<() => Promise<void>>(async () => {
        // console.log(`calling sendBet for contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            const queryId = new Date().getTime();
            return await openedContract.sendBetNft(sender, { queryId, value: toNano("0.05") });
        }, 3, 100);
    }, [ contract, sender ]);

    const sendBurn = useCallback<() => Promise<void>>(async () => {
        // console.log(`calling sendBet for contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            const queryId = new Date().getTime();
            return await openedContract.sendBurn(sender, { queryId, value: toNano("0.05") });
        }, 3, 100);
    }, [ contract, sender ]);

    const getNftData = useCallback<() => Promise<NftItemData | undefined>>(async () => {
        // console.log(`calling getData for contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            return await openedContract.getNftData();
        }, 3, 100);
    }, [ contract ]);

    return {
        contract,
        sendBetNft,
        sendBurn,
        getNftData,
    };
}