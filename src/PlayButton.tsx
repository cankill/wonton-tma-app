import { useTonConnect } from "./hooks/useTonConnect.ts";

export function PlayButton({ sendBet }: { sendBet: () => Promise<void> }) {
    const { connected } = useTonConnect();

    return connected && (
        <button onClick={() => sendBet()}>
            Make a Bet
        </button>
    );
}