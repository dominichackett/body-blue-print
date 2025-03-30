import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RegistrationLayout() {
  return (
    <>
      <StatusBar style="auto" />

      <Stack>
        <Stack.Screen name="welcome"  options={{ headerShown: true }} />
      
      </Stack>

    </>
  );
}
