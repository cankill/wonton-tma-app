import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient } from "@ton/ton";
import { wait } from "../../modules/wonton-lib-common/src/PromisUtils";

const endpoint = await getHttpEndpoint({ network: "testnet"}); // get the decentralized RPC endpoint
const tonClient = new TonClient({ endpoint });                  // initialize ton library

var lastRequestTime: number = new Date().getTime();

export const wonTonClient = async (): Promise<TonClient> => {
  const now = new Date().getTime();
  const diff = now - lastRequestTime;
  if (diff < 1000) {
    await wait(1000 - diff);
  }
  lastRequestTime = new Date().getTime();
  console.log(`Client borrowed at: ${lastRequestTime}`);
  return tonClient;
}