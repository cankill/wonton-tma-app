import { FEUniversesHolder } from "@wonton-lib/Types.ts";
import { address } from "@wonton-lib/TonUtils.ts";
import { log } from "console";

const wontonPrizeFraction = BigInt(import.meta.env.VITE_WONTON_PRIZE_FRACTION_TON!);

const initUniverses = () => {
    const universesHolder: FEUniversesHolder = {universesHolder: {}, collections: {}};
    for (const wonTonPower of Array(12).keys()) {
        const wonTon = address(import.meta.env[`VITE_WONTON_CONTRACT_ADDRESS_${wonTonPower}`]);
        const wCollection = address(import.meta.env[`VITE_WIN_NFT_COLLECTION_ADDRESS_${wonTonPower}`]);
        const lCollection = address(import.meta.env[`VITE_LOOSE_NFT_COLLECTION_ADDRESS_${wonTonPower}`]);

        if (wonTon && wCollection && lCollection) {
            log(`wontonPower: ${wonTonPower} | universe loaded`);
            log(`wontonPower: ${wonTonPower} | WonTon: ${wonTon.toString({ testOnly: true })}`);
            log(`wontonPower: ${wonTonPower} | wCollection: ${wCollection.toString({ testOnly: true })}`);
            log(`wontonPower: ${wonTonPower} | lCollection: ${lCollection.toString({ testOnly: true })}`);
            universesHolder.collections[wCollection.toRawString()] = { cType: 'WIN', wonTonPower: wonTonPower + 1 };
            universesHolder.collections[lCollection.toRawString()] = { cType: 'LOOSE', wonTonPower: wonTonPower + 1 };
            universesHolder.universesHolder[wonTonPower] = {
                wonTonPower,
                wonTon,
                winUniverse: {
                    collection: wCollection,
                },
                looseUniverse: {
                    collection: lCollection,
                },
                // prize: BigInt(820000000) * BigInt(3 ** (wonTonPower + 1))
                prize: wontonPrizeFraction * BigInt(3 ** (wonTonPower + 1)),
            }
        } else {
            // log(`wontonPower: ${wonTonPower} | has no Universes...`);
        }
    }

    return universesHolder;
}

export const globalUniversesHolder = initUniverses();