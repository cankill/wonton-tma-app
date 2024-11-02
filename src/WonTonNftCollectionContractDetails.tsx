import { Card, Space } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollectionData, CollectionType, } from "../modules/wonton-lib-common/src/Types";
import { Address, fromNano } from "@ton/core";
import { testOnly } from "./store/NftsStore.ts";
import { ReloadOutlined } from "@ant-design/icons";

export function WonTonNftCollectionContractDetails({ collectionAddress, collectionType, getData }:
                                                       { collectionAddress: Address, collectionType: CollectionType, getData: () => Promise<CollectionData>, }) {
    const caption = useMemo(() => `WonTon ${collectionType} NFT Collection Contract Details`, [ collectionType ]);
    const [ info, setInfo ] = useState<CollectionData | undefined>();

    const handleUpdate = useCallback(() => {
        console.log(`handle update for ${collectionType} universe for address: ${collectionAddress.toString({ testOnly: true })}`)
        getData().then((data) => { setInfo(data) });
    }, [ getData ]);

    useEffect(() => {
        // console.log(`handle auto update for ${collectionType} universe for address: ${collectionAddress.toString({ testOnly: true })}`)
        getData().then((data) => { setInfo(data) });
    }, [ collectionAddress ])

    return (
        <Card title={caption} bordered={false} style={{ width: '40Rem' }}
              extra={<Space>
                  <button onClick={handleUpdate}><ReloadOutlined/></button>
              </Space>}>
            <div><b>Address:&nbsp;</b><span className="contract-address">{collectionAddress.toString({ testOnly })}</span></div>
            <div><b>Balance:&nbsp;</b>{info && fromNano(info.balance) || 0}</div>
            <div><b>Next Item Index:&nbsp;</b>{info?.next_item_index || 0}</div>
            <div><b>Collection content URL:&nbsp;</b><span className="nft-url">{info?.collection_content_url || 0}</span></div>
            <div><b>Owner address:&nbsp;</b><span className="contract-address">{info?.owner_address?.toString({ testOnly })}</span></div>
        </Card>
    );
}
