import { Image } from "antd";
import { Nft } from "../modules/wonton-lib-common/src/Types";

export function NftItem ( { nft }: {nft: Nft}) {
    return (
      <Image
      width={"3rem"}
      src={nft.nft_meta.image} />
      // preview={ NftItemPreview(nft) }/>
    );  
}