import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react'
import { useMainContract } from './hooks/useMainContract'
import { useTonConnect } from './hooks/useTonConnect';
import { fromNano } from '@ton/core';
import WebApp from '@twa-dev/sdk';

function App() {
  const {
    contract_address,
    counter_value,
    // recent_sender,
    // owner_address,
    contract_balance,
    sendIncrement,
    sendDeposit,
    sendWithdrawal
  } = useMainContract();

  const { connected } = useTonConnect();
  
  const showAlert = () => {
    WebApp.showAlert(`Hey there! Color scheme: ${WebApp.colorScheme}`);
  };

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
            <div className='Hint'>{ fromNano(contract_balance || 0) }</div>  
          )}
        </div>
        <div className='Card'>
          <b>Counter Value</b>
          <div>{counter_value ?? "Loading..."}</div>
        </div>
        
        <a onClick={() => {
          showAlert();
        }}>
          Show alert
        </a>

        <br/>

        {connected &&(
          <a onClick={() => {
            sendIncrement();
          }}>
            Increment By Five
          </a>
        )}
        <br/>
        {connected &&(
          <a onClick={() => {
            sendDeposit();
          }}>
            Deposit 0.1TON
          </a>
        )}
        <br/>
        {connected &&(
          <a onClick={() => {
            sendWithdrawal();
          }}>
            Withdraw 0.1TON
          </a>
        )}
      </div>
    </div>
  )
}

export default App
