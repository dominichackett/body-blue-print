import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RegistrationLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: true }} />
        <Stack.Screen name="personal-info" options={{ headerShown: true }} />
        <Stack.Screen name="activity" options={{ headerShown: true }} />
        <Stack.Screen name="goals" options={{ headerShown: true }} />
        <Stack.Screen name="results" options={{ headerShown: true }} />
      </Stack>
    </>
  );
}
