import { CollectionType } from "@wonton-lib/Types.ts";
import { createNftIndexFrom, testOnly, useNftsStore } from "./store/NftsStore.ts";
import { NftItem } from "./NftItem.tsx";
import { useMemo } from "react";
import { Address } from "@ton/core";

export function NftCollection({ collection_type, walletAddress, wontonPower }: { collection_type: CollectionType, walletAddress: Address, wontonPower: number }) {
    const nftStore = useNftsStore();
    const walletAddressStr = useMemo(() => walletAddress.toString({ testOnly }), [ walletAddress ])
    const filteredNfts = useMemo(() => {
        const filtered = nftStore.filteredNfts(walletAddressStr, collection_type, wontonPower + 1);
        // console.log(`Filtered size for ${collection_type}: ${Object.keys(filtered).length}`);
        return filtered;
    }, [ nftStore.store(walletAddressStr).nfts, wontonPower ]);

    const newNft = useMemo(() => {
        return nftStore.newNft(walletAddressStr);
    }, [walletAddressStr])

    return Object.keys(filteredNfts).map((nftId) =>
        <NftItem nft={filteredNfts[nftId]} key={nftId} isNew={nftId === createNftIndexFrom(newNft)}/>,
    );
}