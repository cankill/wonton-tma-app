'use client'

import Image from "next/image";
import styles from "./page.module.css";
import { TonConnectButton, TonConnectUIProvider } from '@tonconnect/ui-react';

const manifestUrl = "https://cankill.github.io/wonton-tma-app/tonconnect-manifest.json";

export default function Home() {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <span>My App with React UI</span>
      <TonConnectButton />
    </TonConnectUIProvider>        
  );
}
