import './App.css';
import { Card, Image, Space } from "antd";
import { Nft } from "@wonton-lib/Types.ts";
import { NftAttributes } from "./NftAttributes.tsx";
import { PlayButton } from "./PlayButton.tsx";
import { BurnButton } from "./BurnButton.tsx";

export function NftItemPreview({ nft, sendBetNft, sendBurnNft, closePreview }: { nft: Nft, sendBetNft: () => Promise<void>, sendBurnNft: () => Promise<void>, closePreview: () => void }) {
    return (
        <Card hoverable bordered={false} style={{ width: '40Rem' }} className={"aaa"}
              extra={ <Space>
                  { nft.collection_type === 'WIN' ? (<PlayButton sendBet={sendBetNft}/>) : null }
                  <BurnButton sendBurn={sendBurnNft} closePreview={closePreview} />
              </Space> }>
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