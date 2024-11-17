import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CollectionType, Nft, NftsHistory, NftStore, SimpleTransactionHistory, PROCESSED, FOUND, Stores } from '@wonton-lib/Types.ts';
import { checkNftOwner, digForNewNfts } from "../workers/WonTonNftTools.ts";
import { globalUniversesHolder } from "./GlobalUniversesHolder.ts";
import { Address } from "@ton/core";

export const testOnly = import.meta.env.VITE_TEST_ONLY === 'true' || true;
const new_nft_time_span = 30 * 60 * 1000;
const emptyStores= {
    nfts: {},
    transactions: {}
};

export const useNftsStore = create<NftStore>()(
    devtools(
        persist(
            (set, get) => ({
                storesRegistry: {},
                store: (walletAddressStr) => {
                    const currentStoresRegistry = { ...get().storesRegistry };
                    let stores: Stores = currentStoresRegistry[walletAddressStr];
                    if (!stores) {
                        stores = emptyStores
                        set({ storesRegistry: { ...currentStoresRegistry,  [walletAddressStr]: stores }});
                    }

                    return stores
                },
                transactions: (walletAddressStr: string): SimpleTransactionHistory => {
                    return get().store(walletAddressStr).transactions;
                },
                newNft: (walletAddress: string): Nft | undefined => {
                    return get().store(walletAddress).newNft;
                },
                isTransactionProcessed: (walletAddressStr, txHash): boolean => {
                    return get().store(walletAddressStr).transactions[txHash]?.state === PROCESSED;
                },
                addTransaction: (walletAddressStr, newTransaction) => {
                    const store = get().store(walletAddressStr);
                    set({ storesRegistry: {
                            ...get().storesRegistry,
                            [walletAddressStr]: {
                                nfts: store.nfts,
                                transactions: { ...store.transactions, [newTransaction.hash]: newTransaction },
                            },
                        }})
                },
                doesNftExists: (walletAddressStr, cType, wontonPower, nftIndex) => {
                    const store = get().store(walletAddressStr);
                    const key: string = createNftIndex(cType, wontonPower, nftIndex)
                    return key in store.nfts;
                },
                addNft: (walletAddressStr, cType, newNft) => {
                    const store = get().store(walletAddressStr);
                    const key: string = createNftIndex(cType, newNft.wonton_power, newNft.nft_index)
                    set({
                        storesRegistry: {
                            ...get().storesRegistry,
                            [walletAddressStr]: {
                                nfts: { ...store.nfts, [key]: newNft },
                                transactions: store.transactions,
                                newNft: checkNewNft(newNft)
                            },
                        },
                    });
                },
                deleteNft: (walletAddressStr, nftKey) => {
                    const store = get().store(walletAddressStr);
                    const newNfts = { ...store.nfts };
                    delete newNfts[nftKey];
                    set({
                        storesRegistry: {
                            ...get().storesRegistry,
                            [walletAddressStr]: {
                                nfts: newNfts,
                                transactions: store.transactions,
                                newNft: store.newNft
                            },
                        },
                    });
                },
                markTransactionAsProcessed: (walletAddressStr, txHash) => {
                    const store = get().store(walletAddressStr);
                    const updatedTransaction = store.transactions[txHash];
                    if (updatedTransaction) {
                        set({
                            storesRegistry: {
                                ... get().storesRegistry,
                                [walletAddressStr]: {
                                    nfts: store.nfts,
                                    transactions: { ... store.transactions, [txHash]: { ...updatedTransaction, state: PROCESSED } },
                                },
                            }
                        })
                    }
                },
                markNftAsNotMyNft: (walletAddressStr, nftKey, newOwner) => {
                    const store = get().store(walletAddressStr);
                    const updatedNft = store.nfts[nftKey];
                    if (updatedNft) {
                        set({
                            storesRegistry: {
                                ... get().storesRegistry,
                                [walletAddressStr]: {
                                    nfts: { ... store.nfts, [nftKey]: { ...updatedNft, type: 'NON_MY_NFT', owner_address: newOwner.toString({testOnly}) } },
                                    transactions: store.transactions
                                },
                            }
                        })
                    }
                },
                anyNotProcessedTransactions: (walletAddressStr) => {
                    return Object.values(get().store(walletAddressStr).transactions).some((nft)=> nft.state === FOUND);
                },
                filteredNfts: (walletAddressStr, cType) => {
                    const store = get().store(walletAddressStr);
                    const response: NftsHistory = {};
                    for (const [key, nft] of Object.entries(store.nfts)) {
                        if (nft.collection_type === cType && nft.type === 'NFT') {
                            response[key] = nft;
                        }
                    }
                    return response;
                },
                poll: async (walletAddress: Address): Promise<void> => {
                    const walletAddressStr = walletAddress.toString({testOnly});
                    for (const universes of Object.values(globalUniversesHolder)) {
                        console.log(`Wonton power: ${universes.wonTonPower} | Poling Universes`)
                        await digForNewNfts(walletAddress, walletAddressStr, universes, get);
                    }
                },
                updateNftOwner: async (walletAddress: Address): Promise<void> => {
                    const walletAddressStr = walletAddress.toString({testOnly});
                    for (const [nftKey, nft] of Object.entries(get().store(walletAddressStr).nfts)) {
                        // console.log(printJson(nft.nft_address));
                        const ownershipState = await checkNftOwner(Address.parse(nft.nft_address), walletAddress);
                        if (!ownershipState.ownershipApproved) {
                            console.log(`Unlink transferred nft: ${nftKey}`);
                            get().markNftAsNotMyNft(walletAddressStr, nftKey, ownershipState.owner);
                        }
                    }
                }

                // cleanOldRecords: (digDepthHours: number) => set({ transactions: cleanOldRecords(get().transactions, digDepthHours)}),
            }),
            {
                name: `nfts-storage`,
            },
        ),
    ),
);

export const createNftIndex = (cType: CollectionType, wontonPower: number, nftIndex: number) => `${cType}:${wontonPower}:${nftIndex}`;

export const createNftIndexFrom = (nft?: Nft) => `${nft?.collection_type}:${nft?.wonton_power}:${nft?.nft_index}`;

export const checkNewNft = (newNft: Nft): Nft | undefined => {
    const nftDate = +newNft.created_at;
    const now = new Date().getTime();
    const diff = now - nftDate;

    return diff < new_nft_time_span ? newNft : undefined;
}