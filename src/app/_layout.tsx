import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { brand } from '@/brand';
import { arena } from '@/game/look';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** The arena is always "night at the board": one warm dark look in any system theme. */
export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, primary: arena.gold, background: arena.table, card: arena.table, text: arena.text, border: arena.tableHi } }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: arena.table },
          headerTintColor: arena.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: arena.table },
        }}>
        {brand.screens.map((s) => (
          <Stack.Screen key={s.name} name={s.name} options={{ title: s.title, headerShown: !s.hideHeader, presentation: s.modal ? 'modal' : undefined }} />
        ))}
      </Stack>
    </ThemeProvider>
  );
}
