import './App.css';
import { Card, Image, Space } from "antd";
import { Nft } from "@wonton-lib/Types.ts";
import { NftAttributes } from "./NftAttributes.tsx";
import { PlayButton } from "./PlayButton.tsx";

export function NftItemPreview({ nft, sendBetNft }: { nft: Nft, sendBetNft: () => Promise<void> }) {
    return (
        <Card hoverable bordered={false} style={{ width: '40Rem' }} className={"aaa"}
              extra={nft.collection_type === 'WIN' ? (<Space>
                                                       <PlayButton sendBet={sendBetNft}/>
                                                   </Space>)
                                                   : null}>
            {/*<Flex vertical={true} gap="middle">*/}
            <center>
                <Image
                    src={nft.nft_meta?.image}
                    width={"30rem"}
                    preview={false}/>
            </center>
            <div><b>Nft Index: </b>{nft.nft_index}</div>
            <div><b>Collection Type: </b>{nft.collection_type}</div>
            <div><b>Wonton Power: </b>{nft.wonton_power}</div>
            <div><b>Owner Address: </b><span className="contract-address">{nft.owner_address}</span></div>
            <div><b>Created At: </b>{new Date(+nft.created_at).toISOString()}</div>
            <div><b>Name: </b>{nft.nft_meta?.name || "-"}</div>
            <div><b>Description: </b>{nft.nft_meta?.description || "-"}</div>
            {nft.nft_meta?.attributes && (<NftAttributes attributes={nft.nft_meta.attributes}/>)}
            {/*</Flex>*/}
        </Card>
    );
}