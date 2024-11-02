import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { BEUniversesHolder, CollectionType, Nft, NftsHistory, NftStore, SimpleTransactionHistoryItem, SimpleTransactionHistory, CheckNftOwner } from '../../modules/wonton-lib-common/src/Types';
import { address, isTransactionFresh } from "../../modules/wonton-lib-common/src/TonUtils.ts";
import { log } from "console";
import { Address } from "@ton/core";

const wontonPrizeFraction = BigInt(import.meta.env.VITE_WONTON_PRIZE_FRACTION_TON!);
export const testOnly = import.meta.env.VITE_TEST_ONLY === 'true' || true;
const new_nft_time_span = 30 * 60 * 1000;

const initUniverses = () => {
    const universesHolder: BEUniversesHolder = {};
    for (const wonTonPower of Array(12).keys()) {
        const wonTon = address(import.meta.env[`VITE_WONTON_CONTRACT_ADDRESS_${wonTonPower}`]);
        const wCollection = address(import.meta.env[`VITE_WIN_NFT_COLLECTION_ADDRESS_${wonTonPower}`]);
        const lCollection = address(import.meta.env[`VITE_LOOSE_NFT_COLLECTION_ADDRESS_${wonTonPower}`]);

        if (wonTon && wCollection && lCollection) {
            log(`wontonPower: ${wonTonPower} | universe loaded`);
            log(`wontonPower: ${wonTonPower} | WonTon: ${wonTon.toString({ testOnly: true })}`);
            log(`wontonPower: ${wonTonPower} | wCollection: ${wCollection.toString({ testOnly: true })}`);
            log(`wontonPower: ${wonTonPower} | lCollection: ${lCollection.toString({ testOnly: true })}`);
            universesHolder[wonTonPower] = {
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

export const useNftsStore = (forWallet: Address | undefined) => create<NftStore>()(
    devtools(
        persist(
            (set, get) => ({
                newNft: undefined,
                nfts: {},
                transactions: {},
                setNfts: (newNfts) => set({ nfts: newNfts }),
                setTransactions: (newTransactions) => set({ transactions: newTransactions }),
                addNft: (newNft) => set({ newNft: checkNewNft(newNft), nfts: addNft(newNft, get().nfts) }),
                deleteNft: (nftToDelete) => set({ nfts: deleteNft(nftToDelete, get().nfts) }),
                addTransaction: (outMsgHash, newTransaction) => set({ transactions: addTransaction(outMsgHash, newTransaction, get().transactions) }),
                deleteTransaction: (outMsgHash) => set({ transactions: deleteTransaction(outMsgHash, get().transactions) }),
                addTransactions: (newTransactions) => set({ transactions: { ... get().transactions, ... newTransactions } }),
                doesTransactionStored: (outMsgHash) => doesTransactionStored(get().transactions, outMsgHash),
                doesNftExists: (cType, wontonPower: number, nftIndex) => doesNftExists(get().nfts, cType, wontonPower, nftIndex),
                cleanOldRecords: (digDepthHours: number) => set({ transactions: cleanOldRecords(get().transactions, digDepthHours)}),
                clean: () => set({ transactions: {}, nfts: {} }),
                filteredNfts: (cType) => filterNfts(get().nfts, cType),
            }),
            {
                name: `nfts-storage-${forWallet?.toString({ testOnly })}`,
            },
        ),
    ),
);

export const createNftIndex = (cType: CollectionType, wontonPower: number, nftIndex: number) => `${cType}:${wontonPower}:${nftIndex}`;
export const createNftIndexFrom = (nft?: Nft) => `${nft?.collection_type}:${nft?.wonton_power}:${nft?.nft_index}`;

export const addNft = (newNft: Nft, nfts: NftsHistory): NftsHistory => {
    return { ...nfts, [createNftIndexFrom(newNft)]: newNft };
}

export const deleteNft = (nftId: string, nfts: NftsHistory): NftsHistory => {
    const newNfts = { ...nfts };
    delete newNfts[nftId];
    return newNfts;
}

export const checkNewNft = (newNft: Nft): Nft | undefined => {
    const nftDate = +newNft.created_at;
    const now = new Date().getTime();
    const diff = now - nftDate;

    return diff < new_nft_time_span ? newNft : undefined;
}

export const addTransaction = (outMsgHash: string, newTransaction: SimpleTransactionHistoryItem, transactions: SimpleTransactionHistory): SimpleTransactionHistory => {
    return { ...transactions, [outMsgHash]: newTransaction };
}

export const deleteTransaction = (outMsgHash: string, transactions: SimpleTransactionHistory): SimpleTransactionHistory => {
    const newTransaction = { ...transactions };
    delete newTransaction[outMsgHash];
    return newTransaction;
}

export const cleanOldRecords = (transactions: SimpleTransactionHistory, digDepthHours: number): SimpleTransactionHistory => {
    const now = new Date();
    let newTransactions: SimpleTransactionHistory = {};
    Object.keys(transactions).forEach(txKey => {
        const tx = transactions[txKey];
        if (!isTransactionFresh(tx, now, digDepthHours)) {
            console.log(`Delete old transaction hash: ${txKey}`);
        } else {
            newTransactions[txKey] = tx;
        }
    });
    return newTransactions;
}

export const doesNftExists = (nfts: NftsHistory, cType: CollectionType, wontonPower: number, nftIndex: number): boolean => {
    const key: string = createNftIndex(cType, wontonPower, nftIndex)
    return key in nfts;
}

export const filterNfts = (nfts: NftsHistory, cType: CollectionType): NftsHistory => {
    const response: NftsHistory = {};
    const keys = Object.keys(nfts);
    for (const key of keys) {
        const value = nfts[key];
        if (value.collection_type === cType) {
            response[key] = value;
        }
    }
    return response;
}

export const updateNftOwner = async (nfts: NftsHistory, checkOwner: CheckNftOwner): Promise<NftsHistory> => {
    const newNfts: NftsHistory = {};
    for (const nftKey of Object.keys(nfts)) {
        const nft: Nft = nfts[nftKey];
        // console.log(printJson(nft));
        if (await checkOwner(nft.nftAddress)) {
            newNfts[nftKey] = nft;
        } else {
            console.log(`Delete transferred nft: ${nftKey}`);
        }
    }

    return newNfts;
}

export const doesTransactionStored = (transactions: SimpleTransactionHistory, outMsgHash: string): boolean => {
    return outMsgHash in transactions;
}
