import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CollectionType, Nft, NftsHistory, NftStore, TransactionHistory, TransactionHistoryItem } from '../../modules/wonton-lib-common/src/Types';

export const useNftsStore = create<NftStore>()(
  devtools(
    persist(
      (set, get) => ({
        newNft: undefined,
        nfts: {},
        transactions: {},
        setNfts: (newNfts) => set({ nfts: newNfts }),
        setTransactions: (newTransactions) => set({ transactions: newTransactions }),
        addNft: (newNft) => set({ newNft: checkNewNft(newNft), nfts: addNft(newNft, get().nfts) }),
        addTransaction: (outMsgHash, newTransaction) => set({ transactions: addTransaction(outMsgHash, newTransaction, get().transactions) }),
        deleteTransaction: (outMsgHash) => set({ transactions: deleteTransaction(outMsgHash, get().transactions) }),
        // addNfts: (newNfts) => set({ nfts: { ...get().nfts, ...newNfts } }),
        addTransactions: (newTransactions) => set({ transactions: { ...get().transactions, ...newTransactions } }),
        doesNftExists: (cType, nftIndex) => doesNftExists(get().nfts, cType, nftIndex),
        clean: () => set({ transactions: {}, nfts: {}}),
        filteredNfts: (cType) => filterNfts(get().nfts, cType),
      }),
      {
        name: "nfts-storage"
      }
    )
  )
);

export const createNftIndex = (cType: CollectionType, nft_index: number) => `${cType}:${nft_index}`;
export const createNftIndexFrom = (nft?: Nft) => `${nft?.collection_type}:${nft?.nft_index}`;

export const addNft = (newNft: Nft, nfts: NftsHistory): NftsHistory => {
  const index: string = createNftIndexFrom(newNft);
  nfts[index] = newNft;
  return nfts;
}

const new_nft_time_span = 30*60*1000;

export const checkNewNft = (newNft: Nft): Nft | undefined => {
  const nftDate = +newNft.created_at;
  const now = new Date().getTime();
  const diff = now - nftDate;

  return diff < new_nft_time_span ? newNft : undefined;
}

export const addTransaction = (outMsgHash: string, newTransaction: TransactionHistoryItem, transactions: TransactionHistory): TransactionHistory => {
  transactions[outMsgHash] = newTransaction;
  return transactions;
}

export const deleteTransaction = (outMsgHash: string, transactions: TransactionHistory): TransactionHistory => {
  delete transactions[outMsgHash];
  return transactions;
}

export const doesNftExists = (nfts: NftsHistory, cType: CollectionType, nftIndex: number): boolean => {  
  const key: string = createNftIndex(cType, nftIndex)
  return key in nfts;
}

export const filterNfts = (nfts: NftsHistory, cType: CollectionType): NftsHistory => {
  const response: NftsHistory = {}
  const keys = Object.keys(nfts);
  for (const key of keys) {
    const value = nfts[key];
    if (value.collection_type === cType) {
        response[key] = value;
    }
  }
  return response;
}
