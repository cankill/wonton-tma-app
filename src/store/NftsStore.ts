import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CollectionType, Nft, NftsHistory, NftStore, SimpleTransactionHistory, PROCESSED, FOUND, StoreRegistry, Stores } from '@wonton-lib/Types.ts';
import { checkNftOwner, digForNewNfts } from "../workers/WonTonNftTools.ts";
import { globalUniversesHolder } from "./GlobalUniversesHolder.ts";
import { Address } from "@ton/core";

export const testOnly = import.meta.env.VITE_TEST_ONLY === 'true' || true;
const new_nft_time_span = 30 * 60 * 1000;

export const useNftsStore = create<NftStore>()(
    devtools(
        persist(
            (set, get) => ({
                // walletAddress: undefined,
                // walletAddressStr: undefined,
                storesRegistry: {},
                // setWalletAddress: (walletAddress) => set({ walletAddress, walletAddressStr: walletAddress?.toString({testOnly}) }),
                store: (walletAddressStr) => {
                    let stores: Stores = get().storesRegistry[walletAddressStr];
                    if (!stores) {
                        stores = {
                            nfts: {},
                            transactions: {}
                        };

                        const addRegistry: StoreRegistry = {
                            [walletAddressStr]: stores
                        };

                        set({ storesRegistry: { ...get().storesRegistry, ...addRegistry }});
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
                markNftAsNotMyNft: (walletAddressStr, nftKey) => {
                    const store = get().store(walletAddressStr);
                    const updatedNft = store.nfts[nftKey];
                    if (updatedNft) {
                        set({
                            storesRegistry: {
                                ... get().storesRegistry,
                                [walletAddressStr]: {
                                    nfts: { ... store.nfts, [nftKey]: { ...updatedNft, type: 'NON_MY_NFT' } },
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
                    if (!walletAddressStr || !walletAddress) {
                        console.log(`poll | No walletAddress provided, skipping the cycle...`);
                        return;
                    }

                    console.log("Store initialized");
                    console.log(`walletAddressStr: ${walletAddressStr}`);

                    for (const universes of Object.values(globalUniversesHolder)) {
                        console.log(`Wonton power: ${universes.wonTonPower} | Poling WIN Universe`)
                        await digForNewNfts(walletAddress, walletAddressStr, universes, get);
                        // newNftStore = await updateNftsOwner(newNftStore, universes);
                    }
                },
                updateNftOwner: async (walletAddress: Address): Promise<void> => {
                    const walletAddressStr = walletAddress.toString({testOnly});
                    if (!walletAddressStr || !walletAddress) {
                        console.log(`updateNftOwner | No walletAddress provided, skipping the cycle...`);
                        return;
                    }

                    console.log(`Check if owner need to be updated for walletAddressStr: ${walletAddressStr}`);

                    for (const universes of Object.values(globalUniversesHolder)) {
                        console.log(`Wonton power: ${universes.wonTonPower} | Updating owners`)
                        try {
                            for (const [nftKey, nft] of Object.entries(get().store(walletAddressStr).nfts)) {
                                // console.log(printJson(nft));
                                const ownershipApproved = await checkNftOwner(nft.nft_address, walletAddress);
                                if (!ownershipApproved) {
                                    console.log(`Delete transferred nft: ${nftKey}`);
                                    get().markNftAsNotMyNft(walletAddressStr, nftKey);
                                }
                            }
                        } catch (ex) {
                            // @ts-ignore
                            console.error(ex.message)
                        }
                    }
                }

                // setNfts: (newNfts) => set(re{ nfts: newNfts }),
                // setTransactions: (newTransactions) => set({ transactions: newTransactions }),
                // addNfts: (newNfts) => set({ newNft: checkNewNfts(newNfts), nfts: addNfts(newNfts, get().nfts) }),
                // deleteNft: (nftToDelete) => set({ nfts: deleteNft(nftToDelete, get().nfts) }),
                // deleteTransaction: (outMsgHash) => set({ transactions: deleteTransaction(outMsgHash, get().transactions) }),
                // addTransactions: (newTransactions) => set({ transactions: { ... get().transactions, ... newTransactions } }),

                // cleanOldRecords: (digDepthHours: number) => set({ transactions: cleanOldRecords(get().transactions, digDepthHours)}),
                // clean: () => set({ transactions: {}, nfts: {} }),
            }),
            {
                name: `nfts-storage`,
            },
        ),
    ),
);

export const createNftIndex = (cType: CollectionType, wontonPower: number, nftIndex: number) => `${cType}:${wontonPower}:${nftIndex}`;
export const createNftIndexFrom = (nft?: Nft) => `${nft?.collection_type}:${nft?.wonton_power}:${nft?.nft_index}`;

// export const addNft = (newNft: Nft, nfts: NftsHistory): NftsHistory => {
//     return { ...nfts, [createNftIndexFrom(newNft)]: newNft };
// }
//
// export const addNfts = (newNfts: NftsHistory, nfts: NftsHistory): NftsHistory => {
//     return { ...nfts, ...newNfts };
// }
//
// export const deleteNft = (nftId: string, nfts: NftsHistory): NftsHistory => {
//     const newNfts = { ...nfts };
//     delete newNfts[nftId];
//     return newNfts;
// }

export const checkNewNft = (newNft: Nft): Nft | undefined => {
    const nftDate = +newNft.created_at;
    const now = new Date().getTime();
    const diff = now - nftDate;

    return diff < new_nft_time_span ? newNft : undefined;
}
//
// export const checkNewNfts = (newNfts: NftsHistory): Nft | undefined => {
//     let resultNft: Nft|undefined;
//     for(const nft of Object.values(newNfts).sort((nft1, nft2) => Date.parse(nft1.created_at) - Date.parse(nft2.created_at))) {
//         const checkResult = checkNewNft(nft);
//         if (checkResult) {
//             resultNft = checkResult;
//         }
//     }
//
//     return resultNft;
// }
//
// export const addTransaction = (outMsgHash: string, newTransaction: SimpleTransactionHistoryItem, transactions: SimpleTransactionHistory): SimpleTransactionHistory => {
//     return { ...transactions, [outMsgHash]: newTransaction };
// }
//
// export const markTransactionAsProcessed = (outMsgHash: string, transactions: SimpleTransactionHistory): SimpleTransactionHistory => {
//     let tx = transactions[outMsgHash];
//     return tx!! && { ...transactions, [outMsgHash]: { ...tx, state: PROCESSED } };
// }
//
// export const deleteTransaction = (outMsgHash: string, transactions: SimpleTransactionHistory): SimpleTransactionHistory => {
//     const newTransaction = { ...transactions };
//     delete newTransaction[outMsgHash];
//     return newTransaction;
// }
//
// export const cleanOldRecords = (transactions: SimpleTransactionHistory, digDepthHours: number): SimpleTransactionHistory => {
//     const now = new Date();
//     let newTransactions: SimpleTransactionHistory = {};
//     Object.keys(transactions).forEach(txKey => {
//         const tx = transactions[txKey];
//         if (!isTransactionFresh(tx, now, digDepthHours)) {
//             console.log(`Delete old transaction hash: ${txKey}`);
//         } else {
//             newTransactions[txKey] = tx;
//         }
//     });
//     return newTransactions;
// }
//
// export const doesNftExists = (nfts: NftsHistory, cType: CollectionType, wontonPower: number, nftIndex: number): boolean => {
//     const key: string = createNftIndex(cType, wontonPower, nftIndex)
//     return key in nfts;
// }
//
// export const filterNfts = (nfts: NftsHistory, cType: CollectionType): NftsHistory => {
//     const response: NftsHistory = {};
//     const keys = Object.keys(nfts);
//     for (const key of keys) {
//         const value = nfts[key];
//         if (value.collection_type === cType) {
//             response[key] = value;
//         }
//     }
//     return response;
// }
//
// export const filterNotProcessesTransactions = (transactions: SimpleTransactionHistory): SimpleTransactionHistoryItem[] =>
//     Object.values(transactions).filter((nft)=> nft.state === FOUND);
//
// export const anyNotProcessesTransactions = (transactions: SimpleTransactionHistory): boolean =>
//     Object.values(transactions).some((nft)=> nft.state === FOUND);
//
// export const updateNftOwner = async (nfts: NftsHistory, checkOwner: CheckNftOwner): Promise<NftsHistory> => {
//     const newNfts: NftsHistory = {};
//     for (const nftKey of Object.keys(nfts)) {
//         const nft: Nft = nfts[nftKey];
//         // console.log(printJson(nft));
//         if (await checkOwner(nft.nft_address)) {
//             newNfts[nftKey] = nft;
//         } else {
//             console.log(`Delete transferred nft: ${nftKey}`);
//         }
//     }
//
//     return newNfts;
// }
//
// export const doesTransactionStored = (msgHash: string, transactions: SimpleTransactionHistory): boolean => {
//     return msgHash in transactions;
// }
//
// export const transactionStatusFound = (msgHash: string, transactions: SimpleTransactionHistory): boolean => {
//     return (msgHash in transactions) && transactions[msgHash].state === FOUND;
// }
