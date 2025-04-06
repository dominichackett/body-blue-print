import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { WEB3AUTH_CLIENT_ID } from '@env';

import Web3Auth, { LoginParams } from "@web3auth/react-native-sdk";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { ethers } from "ethers";

// Define types for Web3Auth user info
interface Web3AuthUser {
  email?: string;
  name?: string;
  profileImage?: string;
  [key: string]: any; // For additional fields Web3Auth might return
}

interface AuthContextType {
  user: Web3AuthUser | null;
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  ethAddress: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  getBalance: () => Promise<string>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Chain configuration
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13474",
  rpcTarget: "https://n1-us.akave.ai/ext/bc/2JMWNmZbYvWcJRPPy1siaDBZaDGTDAaqXoY5UBKh4YrhNFzEce/rpc",
  displayName: "Akave Testnet",
  blockExplorerUrl: "http://explorer.akave.ai/",
  ticker: "AKVT",
  tickerName: "AKAVE",
  decimals: 18,
  logo: "http://explorer.akave.ai/assets/configs/network_icon.svg",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig,
  },
});

const web3auth = new Web3Auth(WebBrowser, SecureStore, {
  clientId: WEB3AUTH_CLIENT_ID,
  network: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  redirectUrl: 'com.dominichackett.bodyblueprint://(tabs)/',
  privateKeyProvider: privateKeyProvider
});

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Web3AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Initialize the provider and get Ethereum address
  const initEthereumProvider = async () => {
    try {
      if (!web3auth.connected) {
        return;
      }

      // Get the private key from web3auth
      const privateKey = await web3auth?.provider?.request({
        method: "eth_private_key",
      });

      if (!privateKey) {
        console.log("Failed to get private key");
        return;
      }

      // Create ethers wallet from private key
      const wallet = new ethers.Wallet(privateKey);
      
      // Get ethereum address
      const address = wallet.address;
      setEthAddress(address);

      // Create provider
      const rpcUrl = chainConfig.rpcTarget;
      const ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      setProvider(ethersProvider);

      // Create connected wallet (signer)
      const connectedWallet = wallet.connect(ethersProvider);
      setSigner(connectedWallet);

      console.log("Ethereum address:", address);
    } catch (error) {
      console.error("Error initializing Ethereum provider:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing Web3Auth...');
        await web3auth.init();
        console.log('Web3Auth initialized, checking connection status...');
        
        if (web3auth?.ready) {
          if (web3auth?.connected) {
            const userInfo = web3auth.userInfo() as Web3AuthUser;
            setUser(userInfo);
            console.log('User info:', userInfo);
            await initEthereumProvider();
          } else {
            console.log('Web3Auth initialized but not connected');
          }
        } else {
          console.log('Web3Auth object or connected property not ready');
        }
      } catch (error) {
        console.error('Web3Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (params: LoginParams) => {
    try {
      await web3auth.login(params);
      const userInfo = web3auth.userInfo() as Web3AuthUser;
      setUser(userInfo);
      await initEthereumProvider();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await web3auth.logout();
      setUser(null);
      setEthAddress(null);
      setProvider(null);
      setSigner(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get account balance
  const getBalance = async (): Promise<string> => {
    try {
      if (!provider || !ethAddress) {
        throw new Error("Provider or address not initialized");
      }
      
      const balance = await provider.getBalance(ethAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error("Error getting balance:", error);
      throw error;
    }
  };

  // Send transaction
  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    try {
      if (!signer) {
        throw new Error("Signer not initialized");
      }
      
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount),
      });
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        loading, 
        ethAddress, 
        provider, 
        signer, 
        getBalance, 
        sendTransaction 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for type-safe context usage
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, AuthProvider };