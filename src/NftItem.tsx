import { Image } from "antd";
import { Nft } from "../modules/wonton-lib-common/src/Types";
import {NftItemPreview} from "./NftItemPreview.tsx";

export function NftItem ( { nft, isNew }: {nft: Nft, isNew: boolean } ) {
    return (
      <Image
        rootClassName={ isNew ? "new-nft" : "" }
        width={"3rem"}
        src={nft.nft_meta.image}
        preview={{
          destroyOnClose: true,
          imageRender: () => (<NftItemPreview nft={nft} />),
          toolbarRender: () => null,
        }}
      />

      // preview={ NftItemPreview(nft) }/>
    );  
}