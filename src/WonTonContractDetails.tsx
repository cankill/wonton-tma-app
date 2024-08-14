import { Card } from "antd";
import { useWonTonContract } from "./hooks/useWonTon";

export function WonTonContractDetails () {
  const {
    contract_address,
    contract_balance,
    wonton_power,
    bettors_count,
    first_bettor,
    second_bettor,
    nft_data_ref} = useWonTonContract();

    return (
      <Card title="WonTon Contract Details" bordered={false} style={{ width: '40Rem' }}>              
          <div><b>Contract Address: </b><span className='contract-address'>{contract_address}</span></div>              
          <div><b>Contract Balance: </b>{contract_balance || 0}</div>
          <div>
              <div>
                  <b>Wonton Power:&nbsp;</b>{wonton_power || 0}
              </div>
              <div>
                  <b>Bettors Count:&nbsp;</b>{bettors_count || 0}
              </div>
              <div>
                  <b>First Bettor contract:&nbsp;</b><span className='contract-address'>{first_bettor?.toString() || "-"}</span>
              </div>
              <div>
                  <b>Second Bettor contract:&nbsp;</b><span className='contract-address'>{second_bettor?.toString() || "-"}</span>
              </div>
              <Card type="inner" title="Universes" bordered={true}>
                <div>
                  <b>Win Nft index:&nbsp;</b>{nft_data_ref?.win_nft_collection.index || "0"}
                </div>
                <div>
                  <b>Win collection address:&nbsp;</b><span className='contract-address'>{nft_data_ref?.win_nft_collection?.address?.toString() || "-"}</span>
                </div>
                <div>
                  <b>Loose Nft index:&nbsp;</b>{nft_data_ref?.loose_nft_collection.index || "0"}
                </div>
                <div>
                  <b>Loose collection address:&nbsp;</b><span className='contract-address'>{nft_data_ref?.loose_nft_collection?.address?.toString() || "-"}</span>
                </div>
              </Card>
          </div>
      </Card>
    );  
}
