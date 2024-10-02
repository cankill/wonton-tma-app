import { Address, OpenedContract, toNano } from "@ton/core";
import { WonTonContract } from "../../modules/wonton-lib-common/src/contract-wrappers/WonTonContract";
import { useTonConnect } from "./useTonConnect";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";

const wonTonContractAddress = Address.parse(import.meta.env.VITE_WONTON_CONTRACT_0!);
const contract = new WonTonContract(wonTonContractAddress);

export function useWonTonContract() {
    const { sender } = useTonConnect();

    return {
        sendBet: async () => { 
            const client = await wonTonClientProvider.wonTonClient();
            const wontonContractOpened = client.open(contract) as OpenedContract<WonTonContract>;
            return wontonContractOpened.sendBet(sender, { value: toNano("1.0"), provided_wonton_power: 0 });
        },
    };
}
