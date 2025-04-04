import { string } from "@tensorflow/tfjs";

declare module '@env' {
    export const WEB3AUTH_CLIENT_ID: string;
    export const GEMINI_API_KEY:string;
    export const YOUTUBE_API_KEY :string;
    export const prompt:string;
    export const ANURA_API_KEY:string;
    export const ANURA_BASE_URL:string;
    export const ANURA_MODEL_ID:string;
    // Add other environment variables you're using
  }