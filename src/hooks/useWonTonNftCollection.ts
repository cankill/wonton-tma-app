import { useEffect, useState } from "react";
import { useTonClient } from "./useTonClient";
import { Address, fromNano, OpenedContract, toNano } from "@ton/core";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { WonTonNftCollection } from "../../modules/wonton-lib-common/src/contract-wrappers/WonTonNftCollection";
import { useTonConnect } from "./useTonConnect";
import { WonTonCollectionData } from "../../modules/wonton-lib-common/src/Types";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";

export function useWonTonNftCollectionContract(collectionAddressString: string) {
    const client = useTonClient();
    const { sender } = useTonConnect();
    const [contractInformation, setContractInformation] = useState<null | WonTonCollectionData>();

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
            
            // setContractInformation(null);
            const details = await nftCollectionContract.getCollectionData();
            setContractInformation({
                owner_address: details.owner_address,
                next_item_index: details.next_item_index,
                collection_content_url: details.collection_content_url
            });

            if (client) {
                const balance = await client.getBalance(nftCollectionContract.address);
                setBalance(fromNano(balance));    
            }

            await wait(10000);
            getData();
        }

        getData();
    }, [nftCollectionContract]);

    return {
        contract_address: nftCollectionContract?.address.toString(),
        contract_balance: balance,
        ...contractInformation,
    };
}

