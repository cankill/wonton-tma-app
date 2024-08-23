import {useWonTonContract} from "./hooks/useWonTonContract.ts";
import {useTonConnect} from "./hooks/useTonConnect.ts";

export function PlayButton () {
    const { sendBet } = useWonTonContract();
    const { connected} = useTonConnect();

    return connected && (
        <button onClick={() => sendBet()}>
            Make a Bet
        </button>
    );
}