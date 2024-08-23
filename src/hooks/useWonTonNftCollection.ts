import { useEffect, useMemo, useState } from "react";
import { Address, fromNano } from "@ton/core";
import { WonTonCollectionInfo } from "../../modules/wonton-lib-common/src/Types";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";
import { wonTonClientProvider } from "../../modules/wonton-lib-common/src/WonTonClientProvider";
import { decodeOffChainContent } from "../../modules/wonton-lib-common/src/TonUtils";

export function useWonTonNftCollectionContract(collectionAddressString: string): WonTonCollectionInfo|undefined {
    const wonTonCollectionAddress = useMemo(() => Address.parse(collectionAddressString), [collectionAddressString]);
    const [contractInformation, setContractInformation] = useState<WonTonCollectionInfo | undefined>();
    const [started, setStarted] = useState<boolean>(false);

    useEffect(() => {
        if (!started) {
            console.log("useWonTonNftCollectionContract: started");
            
            async function pollingLoop() {
                try {
                    let client = await wonTonClientProvider.wonTonClient();
                    const balance = await client.getBalance(wonTonCollectionAddress);
                    client = await wonTonClientProvider.wonTonClient();
                    const { stack } = await client.runMethod(wonTonCollectionAddress, 'get_collection_data');
            
                    setContractInformation({
                        information: {
                            next_item_index: stack?.readNumber(),
                            collection_content_url: decodeOffChainContent(stack?.readCell()),
                            owner_address: stack?.readAddress(),
                        },
                        balance: fromNano(balance),
                        address: collectionAddressString
                    });
                } catch (ex) {
                    console.error(ex);
                }

                await wait(11000);
                pollingLoop();
            }

            setStarted(true);
            pollingLoop();
        }
    }, [started]);

    return contractInformation;
}

