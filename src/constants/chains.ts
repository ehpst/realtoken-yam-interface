import { realTokenYamUpgradeableABI } from 'src/abis';
import { EthereumSVG, GnosisSVG } from 'src/assets';

import { Contracts, ContractsID } from './contracts';
import { Currency, DAI, ETH } from './currencies';

export enum ChainsID {
  Ethereum = 0x01,
  Gnosis = 0x64,
  Goerli = 0x05,
}

export type Chain = {
  chainId: ChainsID;
  chainName: string;
  logo: string;
  nativeCurrency: Currency;
  rpcUrl: string;
  blockExplorerUrl: string;
  contracts: Contracts;
};

export const CHAINS: Record<ChainsID, Chain> = {
  [ChainsID.Gnosis]: {
    chainId: ChainsID.Gnosis,
    chainName: 'Gnosis Chain',
    logo: GnosisSVG.src,
    nativeCurrency: DAI,
    rpcUrl: 'https://rpc.ankr.com/gnosis',
    blockExplorerUrl: 'https://gnosisscan.io/',
    contracts: {
      [ContractsID.realTokenYamUpgradeable]: {
        abi: realTokenYamUpgradeableABI,
        address: '',
        metadata: { fromBlock: 24582116 },
      },
    },
  },
  [ChainsID.Ethereum]: {
    chainId: ChainsID.Ethereum,
    chainName: 'Ethereum',
    logo: EthereumSVG.src,
    nativeCurrency: ETH,
    rpcUrl: 'https://rpc.ankr.com/eth',
    blockExplorerUrl: 'https://etherscan.io/',
    contracts: {
      [ContractsID.realTokenYamUpgradeable]: {
        abi: realTokenYamUpgradeableABI,
        address: '',
        metadata: { fromBlock: 15741178 },
      },
    },
  },

  [ChainsID.Goerli]: {
    chainId: ChainsID.Goerli,
    chainName: 'Goerli',
    logo: EthereumSVG.src,
    nativeCurrency: ETH,
    rpcUrl:
      'https://eth-goerli.g.alchemy.com/v2/ot7yWosiHjoC8DMV_ESJxZtrMj55za-k', // realt-goerli API 300M/month
    // rpcUrl:
    //   'https://eth.getblock.io/goerli/?api_key=eda96727-5cdd-4551-9e24-aef68d33e782', // getblock API 40k/day
    blockExplorerUrl: 'https://goerli.etherscan.io/',
    contracts: {
      [ContractsID.realTokenYamUpgradeable]: {
        abi: realTokenYamUpgradeableABI,
        address: '0xBDAa060F27D00b9e135C005Ae5Ad0F51C8ba4FD9', // v0.2.0 contract
        metadata: { fromBlock: 7385668 },
      },
    },
  },
};

export const URLS = Object.keys(CHAINS).reduce<Record<number, string>>(
  (accumulator, chainId) => {
    accumulator[Number(chainId)] = CHAINS[Number(chainId) as ChainsID].rpcUrl;
    return accumulator;
  },
  {}
);

export const ALLOWED_CHAINS = Object.keys(URLS).map((chainId) =>
  Number(chainId)
);

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
