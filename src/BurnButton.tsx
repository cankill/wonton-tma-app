import { useTonConnect } from "./hooks/useTonConnect.ts";
import { useCallback } from "react";

export function BurnButton({ sendBurn, closePreview }: { sendBurn: () => Promise<void>, closePreview: () => void }) {
    const { connected } = useTonConnect();

    const onClickHandler = useCallback(() => {
        console.log("closing preview")
        closePreview();
        sendBurn();
    }, [sendBurn, closePreview])

    return connected && (
        <button onClick={() => onClickHandler()}>
            Burn NFT
        </button>
    );
}