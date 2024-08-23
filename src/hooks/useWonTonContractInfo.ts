import { useEffect, useState } from "react";
import { Address, fromNano } from "@ton/core";
import { WonTonInfo } from "../../modules/wonton-lib-common/src/Types";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
import { parseNftDataRef } from "../../modules/wonton-lib-common/src/TonUtils";

const wonTonContractAddress = Address.parse(import.meta.env.VITE_WONTON_CONTRACT!);

export function useWonTonContractInfo() {
    const [contractInformation, setContractInformation] = useState<WonTonInfo|undefined>();
    const [started, setStarted] = useState<boolean>(false);

    useEffect(() => {
        if (!started) {
            console.log("useWonTonContractInfo: started");

            const pollingLoop = async() => {
                try {
                    let client = await wonTonClientProvider.wonTonClient();
                    const balance = await client.getBalance(wonTonContractAddress);
                    client = await wonTonClientProvider.wonTonClient();
                    const { stack } = await client.runMethod(wonTonContractAddress, 'get_information');
                    setContractInformation({
                        wonton_power: stack?.readNumber(),
                        bettors_count: stack?.readNumber(),
                        first_bettor: stack?.readAddressOpt(),
                        second_bettor: stack?.readAddressOpt(),
                        nft_data_ref: parseNftDataRef(stack?.readCell()),
                        balance: fromNano(balance),
                        contract_address: wonTonContractAddress.toString()
                    });
                } catch (ex) {
                    console.error(ex);
                }

                await wait(10000);
                pollingLoop();
            }
            
            setStarted(true);
            pollingLoop();
        }
    }, [started]);

    return contractInformation;
}


