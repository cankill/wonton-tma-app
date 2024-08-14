import './App.css'
import { Address } from "@ton/ton";
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTonConnect } from './hooks/useTonConnect';
import { useWonTonContract } from "./hooks/useWonTon.ts";
import { useEffect, useState } from "react";
import { Flex } from "antd";
import { useNftsStore } from './store/NftsStore.ts';
import { POLL_TIMEOUT, WonTonNftWatchDog } from './workers/WonTonNftWatchDog.ts';
import { wait } from '../modules/wonton-lib-common/src/PromisUtils.ts';
import { NftItem } from './NftItem.tsx';
import { WonTonContractDetails } from './WonTonContractDetails.tsx';
import { WonTonNftCollectionDetails } from './WontonNftCollectionDetails.tsx';
import { WNftCollection } from './WNftCollection.tsx';

// eslint-disable-next-line @typescript-eslint/no-var-requires
window.Buffer = window.Buffer || require("buffer").Buffer;

const win_nft_contract_str = import.meta.env.VITE_WIN_NFT_COLLECTION_ADDRESS;
const loose_nft_contract_str = import.meta.env.VITE_LOOSE_NFT_COLLECTION_ADDRESS;

function App() {
  const { sendBet }                     = useWonTonContract();
  const { connected, walletAddressStr } = useTonConnect();
  const nftStore                        = useNftsStore();
  const [nftWatcher, setNftWatcher]     = useState<WonTonNftWatchDog|undefined>();

  useEffect(() => {
    if (connected) {
      if(!nftWatcher && walletAddressStr) {
        setNftWatcher(new WonTonNftWatchDog(Address.parse(walletAddressStr), nftStore));
      }
    } else {
      setNftWatcher(undefined);
      nftStore.clean();
    }
  }, [connected, walletAddressStr]);
  
  useEffect(() => {
    const watch = async () => {
      if (nftWatcher) {
        await nftWatcher?.poll();
        await wait(POLL_TIMEOUT);
        console.log("Let's watch...")
        if (connected) {
          await watch();
        }
      }
    }

    watch();  
  }, [nftWatcher, connected]);
  
  return (
    <div>
      <Flex vertical={false} gap="middle">
        <Flex vertical={true} gap="middle">
          <Flex vertical={false} gap="middle">
            <TonConnectButton />
            {connected && (
                <button onClick={() => sendBet()}>
                    Make a Bet
                </button>
            )}
          </Flex>        
          <Flex vertical={true} gap="small">
            <WonTonContractDetails />
            {/* <WNftCollection collection_type={'WIN'} collection_address={win_nft_contract_str} />
            <WNftCollection collection_type={'LOOSE'} collection_address={loose_nft_contract_str} /> */}
          </Flex>
        </Flex>  
        <Flex vertical={true} gap="middle">
            { Object.keys(nftStore.nfts).map((nftId) =>
              <NftItem nft={ nftStore.nfts[nftId] } key={nftId}/>
            )}
        </Flex>
      </Flex>
    </div>
  )
}

export default App

