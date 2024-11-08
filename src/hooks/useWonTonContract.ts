import { Address, toNano } from "@ton/core";
import { WonTonContract } from "../../modules/wonton-lib-common/src/contract-wrappers/WonTonContract";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
import { WonTonData } from "../../modules/wonton-lib-common/src/Types.ts";
import { useCallback, useMemo } from "react";
import { useTonConnect } from "./useTonConnect.ts";
import { tryNTimes } from "../../modules/wonton-lib-common/src/PromisUtils.ts";
// import { testOnly } from "../store/NftsStore.ts";

export function useWonTonContract(wontonAddress: Address) {
    const contract = useMemo<WonTonContract>(() => WonTonContract.createFromAddress(wontonAddress), [ wontonAddress ]);
    const { sender } = useTonConnect();

    const openContract = useCallback(async (contract: WonTonContract) => {
        const client = await wonTonClientProvider.wonTonClient();
        return client.open(contract);
    }, [])

    const sendBet = useCallback<() => Promise<boolean>>(async () => {
        // console.log(`calling sendBet for contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            const queryId = new Date().getTime();
            return await openedContract.sendBet(sender, { queryId, value: toNano("1.0"), provided_wonton_power: 0, referrer: 0 });
        }, 3, 100);
    }, [ contract, sender ]);

    const getData = useCallback<() => Promise<WonTonData>>( async () => {
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