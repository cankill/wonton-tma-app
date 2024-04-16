import { useEffect, useState } from "react";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract, toNano } from "ton-core";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { MainContract } from "../contracts/MainContract";
import { useTonConnect } from "./useTonConnect";


export function useMainContract() {
    const client = useTonClient();
    const { sender } = useTonConnect();
    const [contractData, setContractData] = useState<null | {
        counter_value: number;
        recent_sender: Address;
        owner_address: Address;
    }>();

    const [balance, setBalance] = useState<null | number>(0);

    const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

    const mainContract = useAsyncInitialize(async () => {
        if (!client) return;
        const contract = new MainContract(Address.parse('EQDY6qnV4-oz-pEjHY2lMOLrsbRWAgBdK-pdC6cPNR2KN0yD'));

        type NewType = OpenedContract<MainContract>;

        return client.open(contract) as NewType;
    }, [client]);

    useEffect(() => {
        async function getValue() {
            if (!mainContract) return;
            setContractData(null);
            const val = await mainContract.getData();
            console.log(`Main contract data: ${val}`)
            const { balance } = await mainContract.getBalance();
            setContractData({
                counter_value: val.number,
                recent_sender: val.recent_sender,
                owner_address: val.owner_address
            });
            setBalance(balance);
            await sleep(5000);
            getValue();
        }

        getValue();
    }, [mainContract]);

    return {
        contract_address: mainContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendIncrement: async () => { 
            return mainContract?.sendIncrementInternalMessage(sender, toNano("0.05"), 5);
        },
        sendDeposit: async () => {
            return mainContract?.sendDepositInternalMessage(sender, toNano("0.1"))
        },
        sendWithdrawal: async () => {
            return mainContract?.sendWisdrawalInternalMessage(sender, toNano("0.05"), toNano("0.1"))
        }
    };
}

