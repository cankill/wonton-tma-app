import { Address, toNano } from "@ton/core";
import { WonTonContract } from "@wonton-lib/contract-wrappers/WonTonContract.ts";
import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
import { WonTonData } from "@wonton-lib/Types.ts";
import { useCallback, useMemo } from "react";
import { useTonConnect } from "./useTonConnect.ts";
import { tryNTimes } from "@wonton-lib/PromisUtils.ts";
// import { testOnly } from "../store/NftsStore.ts";

export function useWonTonContract(wontonAddress: Address) {
    const contract = useMemo<WonTonContract>(() => WonTonContract.createFromAddress(wontonAddress), [ wontonAddress ]);
    const { sender } = useTonConnect();

    const openContract = useCallback(async (contract: WonTonContract) => {
        const client = await wonTonClientProvider.wonTonClient();
        return client.open(contract);
    }, [])

    const sendBet = useCallback<() => Promise<boolean | undefined>>(async () => {
        // console.log(`calling sendBet for contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            const queryId = new Date().getTime();
            return await openedContract.sendBet(sender, { queryId, value: toNano("1.0"), provided_wonton_power: 0 });
        }, 3, 100);
    }, [ contract, sender ]);

    const getData = useCallback<() => Promise<WonTonData | undefined>>( async () => {
        // console.log(`calling getData for contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            return await openedContract.getData();
        }, 3, 100);
    }, [ contract ]);

    return {
        contract,
        sendBet,
        getData,
    };
}