import { useEffect, useState } from "react";
import { Address, fromNano, OpenedContract } from "@ton/core";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { WonTonNftCollection } from "../../modules/wonton-lib-common/src/contract-wrappers/WonTonNftCollection";
import { WonTonCollectionData, WonTonCollectionInfo } from "../../modules/wonton-lib-common/src/Types";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
import { rateLimiter } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
import { useTonClient } from "./useTonClient";

export function useWonTonNftCollectionContract(collectionAddressString: string): WonTonCollectionInfo|undefined {
    const client = useTonClient();
    const [contractInformation, setContractInformation] = useState<WonTonCollectionData | undefined>();
    const [balance, setBalance] = useState<string>("");

    const nftCollectionContract = useAsyncInitialize(async () => {
        if (!client) return;
        const contract = new WonTonNftCollection(Address.parse(collectionAddressString));
        return client.open(contract) as OpenedContract<WonTonNftCollection>;
    }, [client]);

    // Contract details poller
    useEffect(() => {
        async function getData() {
            if (!nftCollectionContract) return;
            await rateLimiter.limit();
            const details = await nftCollectionContract.getCollectionData();
            setContractInformation({
                owner_address: details.owner_address,
                next_item_index: details.next_item_index,
                collection_content_url: details.collection_content_url
            });

            if (client) {
                await rateLimiter.limit();
                const balance = await client.getBalance(nftCollectionContract.address);
                setBalance(fromNano(balance));    
            }

            await wait(11000);
            getData();
        }

        getData();
    }, [nftCollectionContract, client]);

    if (contractInformation && nftCollectionContract) {
        return {
            contract_address: nftCollectionContract.address.toString(),
            contract_balance: balance,
            contract_information: contractInformation,
        };
    } else {
        return undefined;
    }
}

