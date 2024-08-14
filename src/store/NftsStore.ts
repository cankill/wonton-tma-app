import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CollectionType, Nft, NftsHistory, NftStore, TransactionHistory, TransactionHistoryItem } from '../../modules/wonton-lib-common/src/Types';

export const useNftsStore = create<NftStore>()(
  devtools(
    persist(
      (set, get) => ({
        nfts: {},
        transactions: {},
        setNfts: (newNfts) => set({ nfts: newNfts }),
        setTransactions: (newTransactions) => set({ transactions: newTransactions }),
        addNft: (newNft) => set({ nfts: addNft(newNft, get().nfts) }),
        addTransaction: (outMsgHash, newTransaction) => set({ transactions: addTransaction(outMsgHash, newTransaction, get().transactions) }),
        deleteTransaction: (outMsgHash) => set({ transactions: deleteTransaction(outMsgHash, get().transactions) }),
        addNfts: (newNfts) => set({ nfts: { ...get().nfts, ...newNfts } }),
        addTransactions: (newTransactions) => set({ transactions: { ...get().transactions, ...newTransactions } }),
        doesNftExists: (cType, nftIndex) => doesNftExists(get().nfts, cType, nftIndex),
        clean: () => set({ transactions: {}, nfts: {}}),
      }),
      {
        name: "nfts-storage"
      }
    )
  )
);

export const createNftIndex = (cType: CollectionType, nft_index: number) => `${cType}:${nft_index}`;

export const addNft = (newNft: Nft, nfts: NftsHistory): NftsHistory => {
  const index: string = createNftIndex(newNft.collection_type, newNft.nft_index);
  nfts[index] = newNft;
  return nfts;
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
