import './App.css'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { Dropdown, Flex, MenuProps, Space } from "antd";
import { WonTonContractDetails } from './WonTonContractDetails.tsx';
import { WonTonNftCollectionContractDetails } from './WonTonNftCollectionContractDetails.tsx';
import { useNftWatcher } from './hooks/useNftWatcher.ts';
// import { useTonConnect } from "./hooks/useTonConnect.ts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { globalUniversesHolder } from "./store/NftsStore.ts";
import { useWonTonContract } from "./hooks/useWonTonContract.ts";
import { DownOutlined } from "@ant-design/icons";
import { useWonTonNftCollectionContract } from "./hooks/useWonTonNftCollection.ts";
import { address } from "../modules/wonton-lib-common/src/TonUtils.ts";
import { NftCollection } from "./NftCollection.tsx";
// eslint-disable-next-line @typescript-eslint/no-var-requires
window.Buffer = window.Buffer || require("buffer").Buffer;

function App() {
    const wallet = useTonWallet();
    const walletAddress = useMemo(() => address(wallet?.account.address), [wallet])
    const universesHolder = useMemo(() => globalUniversesHolder, []);
    const [ wontonPower, setWontonPower ] = useState(0);
    const [ universes, setUniverses ] = useState(universesHolder[0]);
    const contract = useWonTonContract(universes.wonTon);
    const wContract = useWonTonNftCollectionContract(universes.winUniverse.collection)
    const lContract = useWonTonNftCollectionContract(universes.looseUniverse.collection)

    useNftWatcher(walletAddress);

    useEffect(() => {
        setUniverses(universesHolder[wontonPower]);
    }, [wontonPower]);

    const onClick: MenuProps['onClick'] = useCallback(({ key }: { key: string }) => {
        setWontonPower(+key);
        console.log(`Setting new universe. wontonPower: ${key}, address: ${universesHolder[+key].wonTon.toString()}`);
    }, []);

    const items: MenuProps["items"] = useMemo(() => {
        return Object.values(universesHolder).map(universes => {
            return {
                key: universes.wonTonPower.toString(),
                label: `Universe ${universes.wonTonPower}`,
            }
        });
    }, [ universesHolder ]);

    return (
        <Flex vertical={true} gap="middle">
            <Flex vertical={false} gap="middle">
                <TonConnectButton/>
                <Dropdown menu={{ items, selectable: true, defaultSelectedKeys: ['0'], onClick }} trigger={['click']}>
                    <a onClick={(e) => e.preventDefault()}>
                        <Space>
                            Universes
                            <DownOutlined/>
                        </Space>
                    </a>
                </Dropdown>
            </Flex>

            <Flex vertical={false} gap="middle">
                <Flex vertical={true} gap="small">
                    <WonTonContractDetails wontonPower={wontonPower} getData={contract.getData} sendBet={contract.sendBet} wontonAddress={universes.wonTon} />
                    <WonTonNftCollectionContractDetails collectionType={'WIN'} getData={wContract.getData} collectionAddress={universes.winUniverse.collection}/>
                    <WonTonNftCollectionContractDetails collectionType={'LOOSE'} getData={lContract.getData} collectionAddress={universes.looseUniverse.collection}/>
                </Flex>
                { walletAddress ? (
                    <Flex vertical={true} gap="middle">
                        <NftCollection collection_type={'WIN'} walletAddress={walletAddress}/>
                        <NftCollection collection_type={'LOOSE'} walletAddress={walletAddress}/>
                    </Flex>
                ) : null }
            </Flex>
        </Flex>
    )
}

export default App

