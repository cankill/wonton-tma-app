import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useTonConnect } from './hooks/useTonConnect';
import WebApp from '@twa-dev/sdk';
import {useWonTonContract} from "./hooks/useWonTon.ts";

// eslint-disable-next-line @typescript-eslint/no-var-requires
window.Buffer = window.Buffer || require("buffer").Buffer;

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
              <b>WebApp platform: </b>
              <b>{WebApp.platform}</b><br/>
              <b>Contract Address: </b>
              <div className='Hint'>{contract_address}</div>
              <b>Contract Balance</b>
              <div className='Hint'>{contract_balance || 0}</div>
              {connected && (
                  <div>
                      <div className='Hint'>
                          <b>Wonton Power:&nbsp;</b>{wonton_power || 0}
                      </div>
                      <div className='Hint'>
                          <b>Bettors Count:&nbsp;</b>{bettors_count || 0}
                      </div>
                      <div className='Hint'>
                          <b>First Bettor contract:&nbsp;</b>{first_bettor?.toString() || "-"}
                      </div>
                      <div className='Hint'>
                          <b>Second Bettor contract:&nbsp;</b>{second_bettor?.toString() || "-"}
                      </div>
                  </div>
              )}
          </div>

          {connected && (
              <button onClick={() => sendBet()}>
                  Make a Bet
              </button>
          )}
      </div>
    </div>
  )
}

export default App
