import {CollectionType } from "../modules/wonton-lib-common/src/Types";
import {createNftIndexFrom, useNftsStore} from "./store/NftsStore.ts";
import {NftItem} from "./NftItem.tsx";
import {useMemo} from "react";

export function NftCollection ({collection_type}: {collection_type: CollectionType}) {
    const nftStore = useNftsStore();
    const filteredNfts = useMemo(() => nftStore.filteredNfts(collection_type), [nftStore]);
    return Object.keys(filteredNfts).map((nftId) =>
        <NftItem nft={ filteredNfts[nftId] } key={nftId} isNew={ nftId === createNftIndexFrom(nftStore.newNft) }/>
    );
}