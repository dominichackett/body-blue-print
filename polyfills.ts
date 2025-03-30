import 'react-native-get-random-values';
//import {crypto} from 'crypto-browserify'; // Full Node.js crypto polyfill
//global.crypto = crypto; // Make crypto available globally
import { Buffer } from 'buffer';
global.Buffer = Buffer;



import 'expo-router/entry'; // Load Router after polyfills