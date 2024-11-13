import { CollectionType } from "@wonton-lib/Types.ts";
import { createNftIndexFrom, testOnly, useNftsStore } from "./store/NftsStore.ts";
import { NftItem } from "./NftItem.tsx";
import { useMemo } from "react";
import { Address } from "@ton/core";

export function NftCollection({ collection_type, walletAddress }: { collection_type: CollectionType, walletAddress: Address }) {
    const nftStore = useNftsStore();
    const walletAddressStr = useMemo(() => walletAddress.toString({ testOnly }), [ walletAddress ])
    const filteredNfts = useMemo(() => {
        const filtered = nftStore.filteredNfts(walletAddressStr, collection_type);
        console.log(`Filtered size for ${collection_type}: ${Object.keys(filtered).length}`);
        return filtered;
    }, [ nftStore.store(walletAddressStr).nfts ]);

    const newNft = useMemo(() => {
        return nftStore.newNft(walletAddressStr);
    }, [walletAddressStr])

    return Object.keys(filteredNfts).map((nftId) =>
        <NftItem nft={filteredNfts[nftId]} key={nftId} isNew={nftId === createNftIndexFrom(newNft)}/>,
    );
}