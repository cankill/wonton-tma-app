import { Card } from "antd";
import { Nft } from "../modules/wonton-lib-common/src/Types";

export function NftItem ( {nft }: {nft: Nft}) {
  const bg = (nft.collection_type == 'WIN')
    ? 'rgba(0, 255, 0, 1.0)'
    : 'rgba(255, 0, 0, 1.0)';

    return (
      <Card
        hoverable
        style={{ width: '5rem' }}
        styles={{ body: {backgroundColor: bg, border: 0} }}
        key={nft.nft_index}>
          {nft.nft_index}
      </Card>);
}