import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RegistrationProvider } from '@/contexts/RegistrationContext';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
export default function RegistrationLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <RegistrationProvider>

      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: true }} />
        <Stack.Screen name="personal-info" options={{ headerShown: true }} />
        <Stack.Screen name="activity" options={{ headerShown: true }} />
        <Stack.Screen name="goals" options={{ headerShown: true }} />
        <Stack.Screen name="results" options={{ headerShown: true }} />
      </Stack>
      </RegistrationProvider>

    </>
  );
}
