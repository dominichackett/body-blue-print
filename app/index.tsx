// app/index.js

import { Redirect } from 'expo-router';
// At the very top of index.tsx

export default function Index() {
  return <Redirect href="/home/welcome" />;
}