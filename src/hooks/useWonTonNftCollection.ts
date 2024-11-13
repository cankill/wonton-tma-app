import { useCallback, useMemo } from "react";
import { Address } from "@ton/core";
import { CollectionData } from "@wonton-lib/Types.ts";
import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
// import { testOnly } from "../store/NftsStore.ts";
import { WonTonNftCollection } from "@wonton-lib/contract-wrappers/WonTonNftCollection.ts";
import { tryNTimes } from "@wonton-lib/PromisUtils.ts";

export function useWonTonNftCollectionContract(wonTonCollectionAddress: Address) {
    const contract = useMemo<WonTonNftCollection>(
        () => WonTonNftCollection.createFromAddress(wonTonCollectionAddress), [ wonTonCollectionAddress ]);

    const openContract = useCallback(async (contract: WonTonNftCollection) => {
        const client = await wonTonClientProvider.wonTonClient();
        return client.open(contract);
    }, [])

    const getData = useCallback<() => Promise<CollectionData | undefined>>(  async () => {
        // console.log(`calling getData for collection contract ${contract?.address.toString({ testOnly })}`);
        return tryNTimes(async () => {
            const openedContract = await openContract(contract);
            return await openedContract.getData();
        }, 3, 100);
    }, [ contract ]);

    return {
        contract,
        getData,
    };
}

