import { getHttpEndpoint } from "@orbs-network/ton-access";
import { useAsyncInitialize } from "./useAsyncInitialize.ts";
import { TonClient } from "@ton/ton";


export function useTonClient() {
    return useAsyncInitialize(
        async () => 
            new TonClient({
                endpoint: await getHttpEndpoint({network: "testnet" }) 
            })
    );
}