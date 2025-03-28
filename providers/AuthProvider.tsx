import React, { createContext, useState, useEffect, ReactNode } from 'react';
import Web3Auth, { LOGIN_PROVIDER, LoginParams, OPENLOGIN_NETWORK } from "@web3auth/react-native-sdk";
import * as WebBrowser from "expo-web-browser";
import  EncryptedStorage  from 'react-native-encrypted-storage';
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import config from '../config'; // Adjust path if needed
const privateKeyProvider = new CommonPrivateKeyProvider({
  config: {
    /*
      pass the chain config that you want to connect with.
      all chainConfig fields are required.
      */
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.OTHER,
      chainId: "0x1",
      rpcTarget: `https://rpc.target.url`,
      displayName: "Display Name",
      blockExplorerUrl: "https://chain.explorer.link",
      ticker: "TKR",
      tickerName: "Ticker Name",
    },
  },
});


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

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Web3AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const web3auth = new Web3Auth(WebBrowser,EncryptedStorage, {
    clientId: config.WEB3AUTH_CLIENT_ID, // Replace with your Client ID
    network: 'testnet', // Or 'mainnet'
    redirectUrl: 'com.dominichackett.bodyblueprint://auth', // Custom scheme
    privateKeyProvider:privateKeyProvider
  });

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.init();
        if (web3auth.connected) {
          const userInfo = await web3auth.userInfo;
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
      await web3auth.login(params);
      const userInfo = await web3auth.userInfo;
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