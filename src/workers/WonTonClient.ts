import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient } from "@ton/ton";
import { RateLimiter } from "../../modules/wonton-lib-common/src/PromisUtils";

const endpoint = await getHttpEndpoint({ network: "testnet"}); // get the decentralized RPC endpoint
const tonClient = new TonClient({ endpoint });                 // initialize ton library
const rateLimiter = new RateLimiter(1200);

export const wonTonClient = async (): Promise<TonClient> => {
  await rateLimiter.limit();  
  console.log(`Client borrowed at: ${new Date().getTime()}`);
  return tonClient;
}