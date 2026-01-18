// src/App.tsx
import { ThemeProvider } from "@/components/theme-provider";
import HomePage from "@/pages/HomePage";
import { STORAGE_KEYS } from "@/constants";

/**
 * App component
 *
 * This is the root component of the application.
 * It sets up the theme provider and will be used for routing in the future.
 */
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey={STORAGE_KEYS.THEME}>
      <HomePage />
    </ThemeProvider>
  );
}
