import { CollectionType } from "../modules/wonton-lib-common/src/Types";
import { createNftIndexFrom, useNftsStore } from "./store/NftsStore.ts";
import { NftItem } from "./NftItem.tsx";
import { useMemo } from "react";
import { Address } from "@ton/core";

export function NftCollection({ collection_type, walletAddress }: { collection_type: CollectionType, walletAddress: Address }) {
    const nftStore = useNftsStore(walletAddress)();
    const filteredNfts = useMemo(() => {
        const filtered = nftStore.filteredNfts(collection_type);
        console.log(`Filtered size for ${collection_type}: ${Object.keys(filtered).length}`);
        return filtered;
    }, [ nftStore ]);

    return Object.keys(filteredNfts).map((nftId) =>
        <NftItem nft={filteredNfts[nftId]} key={nftId} isNew={nftId === createNftIndexFrom(nftStore.newNft)}/>,
    );
}