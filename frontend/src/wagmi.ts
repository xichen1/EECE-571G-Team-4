import { http, createConfig } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [localhost],
    transports: {
      // RPC URL for each chain
      [localhost.id]: http(`http://localhost:8545/`),
    },

    // Required API Keys
    walletConnectProjectId: 'f1bd1b78ec50ebd18a441ffbc45d0ee0',

    // Required App Info
    appName: 'EECE 571G Supply Chain',
  }),
);

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
