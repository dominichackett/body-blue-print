// config.ts
interface Config {
    WEB3AUTH_CLIENT_ID: string;
  }
  
  const config: Config = {
    WEB3AUTH_CLIENT_ID: process.env.WEB3AUTH_CLIENT_ID || '',
  };
  
  export default config;