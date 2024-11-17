import { Image } from "antd";
import { Nft } from "@wonton-lib/Types.ts";
import {NftItemPreview} from "./NftItemPreview.tsx";
import {useMemo} from "react";
import { useNftItemContract } from "./hooks/useNftItemContract.ts";
import { Address } from "@ton/core";

export function NftItem ( { nft, isNew }: { nft: Nft, isNew: boolean } ) {
    const contract = useNftItemContract(Address.parse(nft.nft_address))

    // const imageUrl = useMemo(() => nft.nft_meta?.image.substring(0, nft.nft_meta?.image.lastIndexOf("/")) + "/preview.png", [nft]);
    const imageUrl = useMemo(() => nft.nft_meta?.image, [nft]);
    // console.log(`Nft previw: ${imageUrl}`);
    return (
      <Image
        rootClassName={ isNew ? "new-nft" : "" }
        width={"3rem"}
        src={imageUrl}
        preview={{
          destroyOnClose: false,
          imageRender: () => (<NftItemPreview nft={nft} sendBetNft={contract.sendBetNft} />),
          toolbarRender: () => null,
        }}
      />

      // preview={ NftItemPreview(nft) }/>
    );  
}