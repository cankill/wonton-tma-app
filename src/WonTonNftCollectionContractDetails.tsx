import { Card } from "antd";
import { useMemo } from "react";
import { CollectionType } from "../modules/wonton-lib-common/src/Types";
import { useWonTonNftCollectionContract } from "./hooks/useWonTonNftCollection";

export function WonTonNftCollectionContractDetails ({collection_address, collection_type}: {collection_address: string, collection_type: CollectionType}) {
  const nftCollectionContract = useWonTonNftCollectionContract(collection_address);
  const caption = useMemo(() => `WonTon ${collection_type} NFT Collection Contract Details`, [collection_type]);

  return (
    <Card title={caption} bordered={false} style={{ width: '40Rem' }}>
      <div><b>Address:&nbsp;</b><span className='contract-address'>{nftCollectionContract?.address || '-'}</span></div>
      <div><b>Balance:&nbsp;</b>{nftCollectionContract?.balance || 0}</div>
      <div><b>Next Item Index:&nbsp;</b>{nftCollectionContract?.information.next_item_index || 0}</div>
      <div><b>Collection content URL:&nbsp;</b><span className='nft-url'>{nftCollectionContract?.information.collection_content_url || 0}</span></div>
      <div><b>Owner address:&nbsp;</b><span className='contract-address'>{nftCollectionContract?.information.owner_address?.toString()}</span></div>
    </Card>
  );  
}
