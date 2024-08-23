import {Card, Flex, Image} from "antd";
import { Nft } from "../modules/wonton-lib-common/src/Types";
import {NftAttributes} from "./NftAttributes.tsx";

export function NftItemPreview ( { nft }: {nft: Nft}) {
    return (
      <Card hoverable>
        <Flex vertical={true} gap="middle">
          <Image
            src={nft.nft_meta?.image}
            width={"30rem"}
            preview={false}/>
          <div><b>Nft Index: </b>{nft.nft_index}</div>
          <div><b>Collection Type: </b>{nft.collection_type}</div>
          <div><b>Wonton Power: </b>{nft.wonton_power}</div>
          <div><b>Owner Address: </b><span className='contract-address'>{nft.owner_address}</span></div>
          <div><b>Created At: </b>{ new Date(+nft.created_at).toISOString() }</div>
          <div><b>Name: </b>{nft.nft_meta?.name || "-"}</div>
          <div><b>Description: </b>{nft.nft_meta?.description || "-"}</div>
          {nft.nft_meta?.attributes && (<NftAttributes attributes={nft.nft_meta.attributes} />)}
        </Flex>
      </Card>
    );
}