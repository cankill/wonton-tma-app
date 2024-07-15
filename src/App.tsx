import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useTonConnect } from './hooks/useTonConnect';
import WebApp from '@twa-dev/sdk';
import {useWonTonContract} from "./hooks/useWonTon.ts";

function App() {
  const {
    contract_address,
    contract_balance,
    wonton_power,
    bettors_count,
    first_bettor,
    second_bettor,
    sendBet
  } = useWonTonContract();

  const { connected } = useTonConnect();
  
  return (
    <div>
      <div>
        <TonConnectButton />
      </div>  
      <div>
        <div className='Card'>
          <b>{WebApp.platform}</b><br/>
          <b>Our contract Address</b>
          <div className='Hint'>{ contract_address }</div>
          <b>Our contract Balance</b>
          {contract_balance && (
            <div className='Hint'>{ contract_balance || 0 }</div>
          )}
          {wonton_power && (
            <div className='Hint'>{ wonton_power }</div>
          )}
          {bettors_count && (
            <div className='Hint'>{ bettors_count }</div>
          )}
          {first_bettor && (
            <div className='Hint'>{ first_bettor.toString() }</div>
          )}
          {second_bettor && (
            <div className='Hint'>{ second_bettor.toString() }</div>
          )}
        </div>

        {connected &&(
          <a onClick={() => {
            sendBet();
          }}>
            Make a Bet
          </a>
        )}
      </div>
    </div>
  )
}

export default App
