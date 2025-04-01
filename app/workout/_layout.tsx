import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RegistrationLayout() {
  return (
    <>
      <StatusBar style="auto" />

      <Stack>
        <Stack.Screen name="exercise"  options={{ headerShown: false }} />
        <Stack.Screen name="history"  options={{ headerShown: false }} />
        <Stack.Screen name="mealplans"  options={{ headerShown: false }} />
        <Stack.Screen name="viewmealplan"  options={{ headerShown: false }} />
        <Stack.Screen name="savedworkouts"  options={{ headerShown: false }} />
        <Stack.Screen name="foodhistory"  options={{ headerShown: false }} />




      </Stack>

    </>
  );
}
