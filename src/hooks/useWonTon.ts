import { useEffect, useState } from "react";
import { useTonClient } from "./useTonClient";
import {Address, fromNano, OpenedContract, toNano} from "@ton/core";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { WonTonContract } from "../contracts/WonTonContract.ts";
import { useTonConnect } from "./useTonConnect";


export function useWonTonContract() {
    const client = useTonClient();
    const { sender } = useTonConnect();
    const [contractInformation, setContractInformation] = useState<null | {
        wonton_power: number;
        bettors_count: number;
        first_bettor: Address | null;
        second_bettor: Address | null;
    }>();

    const [balance, setBalance] = useState<string>("");

    const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

    const wontonContract = useAsyncInitialize(async () => {
        if (!client) return;
        const contract = new WonTonContract(Address.parse('EQBa3021BfpJ1kl0EdWtv9TCyB6rxwNsNqySJux1qLg2HrHC'));

        type NewType = OpenedContract<WonTonContract>;

        return client.open(contract) as NewType;
    }, [client]);

    // Contract details poller
    useEffect(() => {
        async function getInformation() {
            if (!wontonContract) return;
            setContractInformation(null);
            const val = await wontonContract.getInformation();
            console.log(`Main contract data: ${val}`)
            const balance = await wontonContract.getBalance();
            setContractInformation({
                wonton_power: val.wonton_power,
                bettors_count: val.bettors_count,
                first_bettor: val.first_bettor,
                second_bettor: val.second_bettor
            });
            setBalance(fromNano(balance));
            await sleep(5000);
            getInformation();
        }

        getInformation();
    }, [wontonContract]);

    return {
        contract_address: wontonContract?.address.toString(),
        contract_balance: balance,
        ...contractInformation,

        sendBet: async () => {
            return wontonContract?.sendBet(sender, { value: toNano("0.05"), provided_wonton_power: 1 });
        },
    };
}

