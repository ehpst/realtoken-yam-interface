import { FC, ReactNode, useEffect } from 'react';

import { Web3ReactProvider } from '@web3-react/core';

import { connectors, metaMask, network } from 'src/connectors';
import { gnosisSafe } from 'src/connectors/gnosisSafe';

type Web3ProvidersProps = {
  children: ReactNode;
};

const ConnectEagerly: FC = () => {
  useEffect(() => {
    void network.activate();
  }, []);

  useEffect(() => {
		console.log('Variable version: ', 2);
		console.log('process.env.NODE_ENV', process.env.NODE_ENV);
    console.log('process.env.NEXT_PUBLIC_ENV', process.env.NEXT_PUBLIC_ENV);
    process.env.NEXT_PUBLIC_ENV === "dev" ? //TODO utiliser un varaible dans le storage pour savoir quelle a été la dernière connexion active 
    void gnosisSafe.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to gnosis safe')
    }): 
    void metaMask.connectEagerly();
  }, [])

  return null;
};

export const Web3Providers: FC<Web3ProvidersProps> = ({ children }) => {
  return (
    <Web3ReactProvider connectors={connectors}>
      <ConnectEagerly />
      {children}
    </Web3ReactProvider>
  );
};
