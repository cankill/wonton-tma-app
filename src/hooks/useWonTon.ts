import { useEffect, useState } from "react";
import { useTonClient } from "./useTonClient";
import { Address, fromNano, OpenedContract, toNano } from "@ton/core";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { WonTonContract } from "../../modules/wonton-lib-common/src/contract-wrappers/WonTonContract";
import { useTonConnect } from "./useTonConnect";
import { WonTonData } from "../../modules/wonton-lib-common/src/Types";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
import { rateLimiter } from "../../modules/wonton-lib-common/src/WonTonClientProvider";

export function useWonTonContract() {
    const client = useTonClient();
    const { sender } = useTonConnect();
    const [contractInformation, setContractInformation] = useState<null | WonTonData>();
    const [balance, setBalance] = useState<string>("");

    const wontonContract = useAsyncInitialize(async () => {
        if (!client) return;
        const contract = new WonTonContract(Address.parse(import.meta.env.VITE_WONTON_CONTRACT));
        return client.open(contract) as OpenedContract<WonTonContract>;
    }, [client]);

    // Contract details poller
    useEffect(() => {
        async function getData() {
            if (!wontonContract) return;
            await rateLimiter.limit();
            const details = await wontonContract.getData();
            setContractInformation({
                wonton_power: details.wonton_power,
                bettors_count: details.bettors_count,
                first_bettor: details.first_bettor,
                second_bettor: details.second_bettor,
                nft_data_ref: details.nft_data_ref
            });
            
            if (client) {
                await rateLimiter.limit();
                const balance = await client.getBalance(wontonContract.address);
                setBalance(fromNano(balance));    
            }

            await wait(10000);
            getData();
        }

        getData();
    }, [wontonContract, client]);

    return {
        contract_address: wontonContract?.address.toString(),
        contract_balance: balance,
        ...contractInformation,

        sendBet: async () => {
            return wontonContract?.sendBet(sender, { value: toNano("1.0"), provided_wonton_power: 0 });
        },
    };
}

