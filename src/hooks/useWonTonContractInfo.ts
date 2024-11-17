import { useEffect, useState } from "react";
import { Address, fromNano } from "@ton/core";
import { WonTonInfo } from "@wonton-lib/Types.ts";
import { wait } from "@wonton-lib/PromisUtils.ts";
import { wonTonClientProvider } from "@wonton-lib/WonTonClientProvider.ts";
import { parseNftDataRef, parseReferralProxyRef } from "@wonton-lib/TonUtils.ts";

export function useWonTonContractInfo(wonTonContractAddress: Address) {
    const [address, setAddress] = useState<Address>(wonTonContractAddress);
    const [info, setInfo] = useState<WonTonInfo|undefined>();
    const [started, setStarted] = useState<boolean>(false);

    useEffect(() => {
        if (!started) {
            console.log("useWonTonContractInfo: started");

            const pollingLoop = async() => {
                try {
                    let client = await wonTonClientProvider.wonTonClient();
                    const { stack } = await client.runMethod(address, 'get_information');
                    if (stack.remaining === 7) {
                        setInfo({
                            balance: fromNano(stack.readBigNumber()),
                            wonton_power: stack.readNumber(),
                            wonton_prize: stack.readBigNumber(),
                            bettors_count: stack.readNumber(),
                            first_bettor: stack.readAddressOpt(),
                            second_bettor: stack.readAddressOpt(),
                            referral_proxy: { active: false, address: null },
                            nft_data_ref: parseNftDataRef(stack.readCell()),
                            contract_address: address.toString(),
                        });
                    } else {
                        setInfo({
                            balance: fromNano(stack.readBigNumber()),
                            wonton_power: stack.readNumber(),
                            wonton_prize: stack.readBigNumber(),
                            bettors_count: stack.readNumber(),
                            first_bettor: stack.readAddressOpt(),
                            second_bettor: stack.readAddressOpt(),
                            referral_proxy: parseReferralProxyRef(stack.readCell()),
                            nft_data_ref: parseNftDataRef(stack.readCell()),
                            contract_address: address.toString(),
                        });
                    }
                } catch (ex) {
                    console.error(ex);
                }

                await wait(15000);
                await pollingLoop();
            }
            
            setStarted(true);
            pollingLoop();
        }

    }, [started, address]);

    return ({
        address,
        setAddress,
        info });
}


