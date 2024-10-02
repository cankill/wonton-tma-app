import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react';
import { Flex } from "antd";
import { WonTonContractDetails } from './WonTonContractDetails.tsx';
import { WonTonNftCollectionContractDetails } from './WonTonNftCollectionContractDetails.tsx';
import { NftCollection } from "./NftCollection.tsx";
import { PlayButton } from "./PlayButton.tsx";
import { useNftWatcher } from './hooks/useNftWatcher.ts';

// eslint-disable-next-line @typescript-eslint/no-var-requires
window.Buffer = window.Buffer || require("buffer").Buffer;

const win_nft_contract_str = import.meta.env.VITE_WIN_NFT_COLLECTION_ADDRESS;
const loose_nft_contract_str = import.meta.env.VITE_LOOSE_NFT_COLLECTION_ADDRESS_0;

function App() {
  
  useNftWatcher();
  
  return (
      <Flex vertical={true} gap="middle">
        <Flex vertical={false} gap="middle">
          <TonConnectButton />
          <PlayButton />
        </Flex>
        <Flex vertical={false} gap="middle">
            <Flex vertical={true} gap="small">
                <WonTonContractDetails />
                <WonTonNftCollectionContractDetails collection_type={'WIN'} collection_address={win_nft_contract_str} />
                <WonTonNftCollectionContractDetails collection_type={'LOOSE'} collection_address={loose_nft_contract_str} />
            </Flex>
            <Flex vertical={true} gap="middle">
                <NftCollection collection_type={'WIN'} />
                <NftCollection collection_type={'LOOSE'} />
            </Flex>
        </Flex>
      </Flex>
  )
}

export default App

