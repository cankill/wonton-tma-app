import { Card, Image } from "antd";
import { Nft } from "../modules/wonton-lib-common/src/Types";

export function NftItemPreview ( { nft }: {nft: Nft}) {
    return (
      <Card
        hoverable
        style={{ width: '5rem' }}>
          {nft.nft_index}
      </Card>
    );
}