import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { WEB3AUTH_CLIENT_ID } from '@env';

import Web3Auth, {  LoginParams } from "@web3auth/react-native-sdk";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";




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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// IMP START - SDK Initialization
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://sepolia.infura.io/v3/cc3d735754d4494ab257cc446f1ab511",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  decimals: 18,
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig,
  },
});


const web3auth = new Web3Auth(WebBrowser,SecureStore, {
  clientId:WEB3AUTH_CLIENT_ID,
  network:WEB3AUTH_NETWORK.SAPPHIRE_DEVNET , // Or 'mainnet'
  redirectUrl: 'com.dominichackett.bodyblueprint://(tabs)/', // Custom scheme
  privateKeyProvider:privateKeyProvider
});

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Web3AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing Web3Auth...');
        await web3auth.init();
        console.log('Web3Auth initialized, checking connection status...');
        if(web3auth?.ready)
        // Check if web3auth is properly initialized and has connected property
        if (web3auth && typeof web3auth?.connected === 'boolean') {
          if (web3auth?.connected) {
            const userInfo =  web3auth.userInfo() as Web3AuthUser; // userInfo might also be async
            setUser(userInfo);
            console.log('User info:', userInfo);
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
      const userInfo =  web3auth.userInfo() as Web3AuthUser;
      setUser(userInfo);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await web3auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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