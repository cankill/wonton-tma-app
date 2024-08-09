import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useTonConnect } from './hooks/useTonConnect';
import {useWonTonContract} from "./hooks/useWonTon.ts";
import { useEffect, useMemo } from "react";
import { Card, Flex } from "antd";
import { useWonTonNftCollectionContract } from './hooks/useWonTonNftCollection.ts';
import { isNftsEvent, NftWatcherCommand } from '../modules/wonton-lib-common/src/Types.ts';
import { useNftsStore } from './store/NftsStore.ts';


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
  const {
    winNfts,
    looseNfts,
    winTransactions,
    looseTransactions,
    setWinNfts,
    setLooseNfts,
    setWinTransactions,
    setLooseTransactions }              = useNftsStore();
    
  const worker: Worker = useMemo(() => {
    console.log("Let's start WonTonNftWatchDog");
    return new Worker(new URL("./workers/WonTonNftWatchDog.ts", import.meta.url), { type: 'module' })
  }, []);

  worker.onerror = e => {
    console.error(e);
  }

  useEffect(() => {
    if (connected && walletAddressStr && winNfts && looseNfts && winTransactions && looseTransactions) {
      const cmd: NftWatcherCommand = {
        walletAddressStr,
        winNfts,
        looseNfts,
        winTransactions,
        looseTransactions
      }

      console.log(`Posting new message: ${JSON.stringify(cmd)}`);
      worker.postMessage(cmd);
    }
    
  }, [worker, connected, walletAddressStr]);

  useEffect(() => {
    worker.onmessage = (ev) => {
        console.log("isNftsEvent(ev.data): ", isNftsEvent(ev.data));
        if (isNftsEvent(ev.data)) {
          switch(ev.data.universe) {
            case "WIN": 
              console.log("Setting win universe: ", JSON.stringify(ev.data.nfts));
              setWinNfts(ev.data.nfts);
              setWinTransactions(ev.data.transactions)
              break;
            case "LOOSE":
              console.log("Setting loose universe: ", JSON.stringify(ev.data.nfts));
              setLooseNfts(ev.data.nfts);
              setLooseTransactions(ev.data.transactions)
              break;
          }
        }
    }
  }, [worker]);
  
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
            { Object.keys(winNfts).map((nftId) => 
              <Card
                hoverable
                style={{ width: '5rem' }}
                styles={{ body: {backgroundColor: 'rgba(0, 255, 0, 1.0)', border: 0} }}
                key={nftId}>
                {nftId}
              </Card>
            )}
            { Object.keys(looseNfts).map((nftId) => 
              <Card
                hoverable
                style={{ width: '5rem' }}
                styles={{ body: {backgroundColor: 'rgba(255, 0, 0, 1.0)', border: 0} }}
                key={nftId}>
                {nftId}
              </Card>
            )}
        </Flex>
      </Flex>
    </div>
  )
}

export default App

