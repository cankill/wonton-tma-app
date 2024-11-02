import { Card, Space } from "antd";
import { WonTonData } from "../modules/wonton-lib-common/src/Types.ts";
import { useCallback, useEffect, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { PlayButton } from "./PlayButton.tsx";
import { Address, fromNano } from "@ton/core";
import { testOnly } from "./store/NftsStore.ts";
import { useVisibilityChange } from "./hooks/useVisibilityChange.ts";
import { useInterval } from "./hooks/useInterval.ts";
import { POLLING_INTERVAL } from "./hooks/useNftWatcher.ts";

export function WonTonContractDetails({ getData, sendBet, wontonAddress, wontonPower }:
                                          { getData: () => Promise<WonTonData>, sendBet: () => Promise<boolean>, wontonAddress: Address, wontonPower: number }) {
    const [ pollingInterval, setPollingInterval ] = useState<number | undefined>(POLLING_INTERVAL);
    const [ info, setInfo ] = useState<WonTonData | undefined>();
    const isPageVisible = useVisibilityChange();

    // console.log(`WonTonContractDetails: ${wontonAddress.toString({ testOnly: true })}`);

    const handleUpdate = useCallback(() => {
        // console.log(`handle update for ${wontonAddress.toString({ testOnly: true })}`)
        getData().then((data) => { setInfo(data) });
    }, [ getData ]);

    useEffect(() => {
        // console.log(`handle auto update for ${wontonAddress.toString({ testOnly: true })}`)
        getData().then((data) => { setInfo(data) });
    }, [ wontonAddress ])

    useEffect(() => {
        if (isPageVisible) {
            setPollingInterval(POLLING_INTERVAL);
        } else {
            setPollingInterval(undefined);
        }
    }, [ isPageVisible ]);

    useInterval(async () => {
        // console.log(`${new Date().getTime()}: polling data for wonTon contract: ${wontonAddress.toString({ testOnly: true })}`)
        getData().then((data) => { setInfo(data) });
    }, pollingInterval);

    return (
        <Card title="WonTon Contract Details" bordered={false} style={{ width: '40Rem' }}
              extra={<Space>
                  <button onClick={handleUpdate}><ReloadOutlined/></button>
                  {wontonPower === 0 && <PlayButton sendBet={sendBet}/>}
              </Space>}>

            <div><b>Contract Address: </b><span className="contract-address">{wontonAddress.toString({ testOnly }) || "-"}</span></div>
            <div><b>Contract Balance: </b>{info && fromNano(info.balance) || 0}</div>
            <div>
                <b>Wonton Power:&nbsp;</b>{info?.wonton_power || 0}
            </div>
            <div>
                <b>Bettors Count:&nbsp;</b>{info?.bettors_count || 0}
            </div>
            <div>
                <b>First Bettor contract:&nbsp;</b><span className="contract-address">{info?.first_bettor?.toString({ testOnly }) || "-"}</span>
            </div>
            <div>
                <b>Second Bettor contract:&nbsp;</b><span className="contract-address">{info?.second_bettor?.toString({ testOnly }) || "-"}</span>
            </div>
            <Card type="inner" title="Universes" bordered={true}>
                <div>
                    <b>Win Nft index:&nbsp;</b>{info?.nft_data_ref?.win_nft_collection.index || "0"}
                </div>
                <div>
                    <b>Win collection address:&nbsp;</b><span className="contract-address">{info?.nft_data_ref?.win_nft_collection?.address?.toString({ testOnly }) || "-"}</span>
                </div>
                <div>
                    <b>Loose Nft index:&nbsp;</b>{info?.nft_data_ref?.loose_nft_collection.index || "0"}
                </div>
                <div>
                    <b>Loose collection address:&nbsp;</b><span className="contract-address">{info?.nft_data_ref?.loose_nft_collection?.address?.toString({ testOnly }) || "-"}</span>
                </div>
            </Card>
        </Card>
    );
}
