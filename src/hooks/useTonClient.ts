import { TonClient } from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { useAsyncInitialize } from "./useAsyncInitialize.ts";


export function useTonClient() {
    return useAsyncInitialize(
        async () => 
            new TonClient({
                endpoint: await getHttpEndpoint({network: "testnet" }) 
            })
    );
}