import React, { createContext, useState, useEffect, ReactNode } from 'react';

import Web3Auth, { LOGIN_PROVIDER, LoginParams ,WEB3AUTH_NETWORK_TYPE} from "@web3auth/react-native-sdk";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
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
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
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
  clientId:'BD7Y19ePeIm9VJS-83sl8JsG_CTU0vHzt9zc240Py-6irvQQi8mMcJiwP7mWkH__07fmIIewBmFwWsTlQJbO06I', // Replace with your Client ID
  network:WEB3AUTH_NETWORK.SAPPHIRE_DEVNET , // Or 'mainnet'
  redirectUrl: 'com.dominichackett.bodyblueprint://auth', // Custom scheme
  privateKeyProvider:privateKeyProvider
});

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Web3AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.init();
        if (web3auth.connected) {
          const userInfo =  web3auth.userInfo;
          setUser(userInfo);
        }
      } catch (error) {
        console.error('Init failed:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (params: LoginParams) => {
    try {
      await web3auth.init()
      await web3auth.login(params);
      const userInfo =  web3auth.userInfo;
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