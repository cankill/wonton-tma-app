import { useCallback, useMemo } from "react";
import { Address } from "@ton/core";
import { CollectionData } from "../../modules/wonton-lib-common/src/Types";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
// import { testOnly } from "../store/NftsStore.ts";
import { WonTonNftCollection } from "../../modules/wonton-lib-common/src/contract-wrappers/WonTonNftCollection.ts";
import { tryNTimes } from "../../modules/wonton-lib-common/src/PromisUtils.ts";

export function useWonTonNftCollectionContract(wonTonCollectionAddress: Address) {
    const contract = useMemo<WonTonNftCollection>(
        () => WonTonNftCollection.createFromAddress(wonTonCollectionAddress), [ wonTonCollectionAddress ]);

    const openContract = useCallback(async (contract: WonTonNftCollection) => {
        const client = await wonTonClientProvider.wonTonClient();
        return client.open(contract);
    }, [])

    const getData = useCallback<() => Promise<CollectionData>>( async () => {
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

