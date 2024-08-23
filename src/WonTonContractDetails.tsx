import { Card } from "antd";
import { useWonTonContractInfo } from "./hooks/useWonTonContractInfo";

export function WonTonContractDetails () {
  const info = useWonTonContractInfo();

    return (
      <Card title="WonTon Contract Details" bordered={false} style={{ width: '40Rem' }}>              
          <div><b>Contract Address: </b><span className='contract-address'>{info?.contract_address || "-"}</span></div>              
          <div><b>Contract Balance: </b>{info?.balance || 0}</div>
            <div>
                <b>Wonton Power:&nbsp;</b>{info?.wonton_power || 0}
            </div>
            <div>
                <b>Bettors Count:&nbsp;</b>{info?.bettors_count || 0}
            </div>
            <div>
                <b>First Bettor contract:&nbsp;</b><span className='contract-address'>{info?.first_bettor?.toString() || "-"}</span>
            </div>
            <div>
                <b>Second Bettor contract:&nbsp;</b><span className='contract-address'>{info?.second_bettor?.toString() || "-"}</span>
            </div>
            <Card type="inner" title="Universes" bordered={true}>
              <div>
                <b>Win Nft index:&nbsp;</b>{info?.nft_data_ref?.win_nft_collection.index || "0"}
              </div>
              <div>
                <b>Win collection address:&nbsp;</b><span className='contract-address'>{info?.nft_data_ref?.win_nft_collection?.address?.toString() || "-"}</span>
              </div>
              <div>
                <b>Loose Nft index:&nbsp;</b>{info?.nft_data_ref?.loose_nft_collection.index || "0"}
              </div>
              <div>
                <b>Loose collection address:&nbsp;</b><span className='contract-address'>{info?.nft_data_ref?.loose_nft_collection?.address?.toString() || "-"}</span>
              </div>
            </Card>
      </Card>
    );  
}
