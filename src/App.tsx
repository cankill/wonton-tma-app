import './App.css'
import { Address } from "@ton/ton";
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonConnect } from './hooks/useTonConnect';
import { useWonTonContract } from "./hooks/useWonTon.ts";
import { useEffect, useMemo, useState } from "react";
import { Card, Flex } from "antd";
import { useWonTonNftCollectionContract } from './hooks/useWonTonNftCollection.ts';
import { isNftsEvent, NftWatcherCommand } from '../modules/wonton-lib-common/src/Types.ts';
import { useNftsStore } from './store/NftsStore.ts';
import { POLL_TIMEOUT, WonTonNftWatchDog } from './workers/WonTonNftWatchDog.ts';
import { wait } from '../modules/wonton-lib-common/src/PromisUtils.ts';
import { NftItem } from './NftItem.tsx';

// eslint-disable-next-line @typescript-eslint/no-var-requires
window.Buffer = window.Buffer || require("buffer").Buffer;

const win_nft_contract_str = import.meta.env.VITE_WIN_NFT_COLLECTION_ADDRESS;
const loose_nft_contract_str = import.meta.env.VITE_LOOSE_NFT_COLLECTION_ADDRESS;

function App() {
  const {
    contract_address,
    contract_balance,
    wonton_power,
    bettors_count,
    first_bettor,
    second_bettor,
    nft_data_ref,
    sendBet}                            = useWonTonContract();
  const winNftContract                  = useWonTonNftCollectionContract(win_nft_contract_str);
  const looseNftContract                = useWonTonNftCollectionContract(loose_nft_contract_str);
  const { connected, walletAddressStr } = useTonConnect();
  const nftStore                        = useNftsStore();
  const [nftWatcher, setNftWatcher]     = useState<WonTonNftWatchDog|undefined>();

  useEffect(() => {
    if (connected && walletAddressStr) {
      if(!nftWatcher) {
        setNftWatcher(new WonTonNftWatchDog(Address.parse(walletAddressStr), nftStore));
      }
    }    
  }, [connected, walletAddressStr]);
  
  useEffect(() => {
    const watch = async () => {
      await nftWatcher?.poll();
      await wait(POLL_TIMEOUT);
      await watch();
    }
    
    if (nftWatcher) {
      watch();  
    }    
  }, [nftWatcher]);
  
  return (
    <div>
      <Flex vertical={false} gap="middle" style={{ border: "2px, red" }}>
        <Flex vertical={true} gap="middle">
          <Flex vertical={false} gap="middle">
            <TonConnectButton />
              {/* <div className='Card'>
                  <b>WebApp platform: </b>
                  <b>{WebApp.platform}</b><br/>
              </div> */}
              {connected && (
                  <button onClick={() => sendBet()}>
                      Make a Bet
                  </button>
              )}
          </Flex>        
          <Flex vertical={true} gap="small">
            <Card title="WonTon Contract Details" bordered={false} style={{ width: '40Rem' }}>              
              <div><b>Contract Address: </b><span className='contract-address'>{contract_address}</span></div>              
              <div><b>Contract Balance: </b>{contract_balance || 0}</div>
              {connected && (
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
                      <Card type="inner" title="Universe" bordered={true}>
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
              )}
            </Card>

            <Card title="WonTon Win NFT Collection Contract Details" bordered={false}>
              <div><b>Contract Address: </b><span className='contract-address'>{winNftContract.contract_address}</span></div>              
              <div><b>Contract Balance: </b>{winNftContract.contract_balance || 0}</div>
              {connected && (
                  <div>
                      <div>
                          <b>Next Item Index:&nbsp;</b>{winNftContract.next_item_index || 0}
                      </div>
                      <div>
                          <b>Collection content URL:&nbsp;</b><span className='nft-url'>{winNftContract.collection_content_url || 0}</span>
                      </div>
                      <div>
                          <b>Owner address:&nbsp;</b><span className='contract-address'>{winNftContract.owner_address?.toString()}</span>
                      </div>
                  </div>
              )}
            </Card>

            <Card title="WonTon Loose NFT Collection Contract Details" bordered={false}>
              <div><b>Contract Address: </b><span className='contract-address'>{looseNftContract.contract_address}</span></div>              
              <div><b>Contract Balance: </b>{looseNftContract.contract_balance || 0}</div>
              {connected && (
                  <div>
                      <div>
                          <b>Next Item Index:&nbsp;</b>{looseNftContract.next_item_index || 0}
                      </div>
                      <div>
                          <b>Collection content URL:&nbsp;</b><span className='nft-url'>{looseNftContract.collection_content_url || 0}</span>
                      </div>
                      <div>
                          <b>Owner address:&nbsp;</b><span className='contract-address'>{looseNftContract.owner_address?.toString()}</span>
                      </div>
                  </div>
              )}
            </Card>
          </Flex>
        </Flex>  
        <Flex vertical={true} gap="middle">
            { Object.keys(nftStore.nfts).map((nftId) =>
              <NftItem nft={ nftStore.nfts[nftId] } />
            )}
        </Flex>
      </Flex>
    </div>
  )
}

export default App

