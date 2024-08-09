import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { NftStore } from '../../modules/wonton-lib-common/src/Types';

export const useNftsStore = create<NftStore>()(
  devtools(
    persist(
      (set, get) => ({
        winNfts: {},
        winTransactions: {},
        looseNfts: {},
        looseTransactions: {},
        setWinNfts: (newNfts) => set((state) => ({ winNfts: newNfts })),
        setLooseNfts: (newNfts) => set((state) => ({ looseNfts: newNfts })),
        setWinTransactions: (newTransactions) => set((state) => ({ winTransactions: newTransactions })),
        setLooseTransactions: (newTransactions) => set((state) => ({ looseTransactions: newTransactions }))
      }),
      {
        name: "nfts-storage"
      }
    )
  )
);