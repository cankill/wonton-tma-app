import { Sender, SenderArguments } from "@ton/core";
import {useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";

export function useTonConnect(): {
    sender: Sender;
    connected: boolean;
    walletAddressStr: string | undefined,
} {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    return {
        sender: {
            send: async (args: SenderArguments) => {
                tonConnectUI.sendTransaction({
                    messages: [
                        {
                            address: args.to.toString(),
                            amount: args.value.toString(),
                            payload: args.body?.toBoc().toString("base64")
                        }
                    ],
                    validUntil: Date.now() + 5 * 60 * 1000,
                });
            },
        },
        connected: tonConnectUI.connected,
        walletAddressStr: wallet?.account.address,
    }
}