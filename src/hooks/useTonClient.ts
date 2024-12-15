import { getHttpEndpoint } from "@orbs-network/ton-access";
import { useAsyncInitialize } from "./useAsyncInitialize.ts";
import { TonClient } from "@ton/ton";
import { testOnly } from "../store/NftsStore.ts";

export function useTonClient() {
    return useAsyncInitialize(async () => new TonClient({ endpoint: await getHttpEndpoint({
            network: testOnly ? "testnet" : "mainnet"
    }) }));
}