import { Image } from "antd";
import { Nft } from "../modules/wonton-lib-common/src/Types";
import {NftItemPreview} from "./NftItemPreview.tsx";
import {useMemo} from "react";

export function NftItem ( { nft, isNew }: { nft: Nft, isNew: boolean } ) {
    const imageUrl = useMemo(() => nft.nft_meta?.image.substring(0, nft.nft_meta?.image.lastIndexOf("/")) + "/preview.png", [nft]);
    console.log(`Nft previw: ${imageUrl}`);
    return (
      <Image
        rootClassName={ isNew ? "new-nft" : "" }
        width={"3rem"}
        src={imageUrl}
        preview={{
          destroyOnClose: true,
          imageRender: () => (<NftItemPreview nft={nft} />),
          toolbarRender: () => null,
        }}
      />

      // preview={ NftItemPreview(nft) }/>
    );  
}