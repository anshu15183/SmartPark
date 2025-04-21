
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Set default theme to 'dark' if not specified
  const mergedProps = {
    defaultTheme: 'dark',
    storageKey: 'ui-theme',
    enableSystem: false, // Disable system preference to ensure our theme persists
    attribute: 'class',
    disableTransitionOnChange: false,
    ...props
  };
  
  React.useEffect(() => {
    // Ensure the theme is applied immediately on component mount
    const savedTheme = localStorage.getItem('ui-theme');
    if (savedTheme) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme);
    } else {
      // If no theme has been saved, set the default
      localStorage.setItem('ui-theme', mergedProps.defaultTheme);
      document.documentElement.classList.add(mergedProps.defaultTheme);
    }
  }, [mergedProps.defaultTheme]);
  
  return <NextThemesProvider {...mergedProps}>{children}</NextThemesProvider>
}
