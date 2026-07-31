import { App, ConfigProvider } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRelayTheme } from "@relayops/ui";
import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { useColorMode } from "../hooks/use-color-mode";
import { queryClient } from "./query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  const colorMode = useColorMode();

  // Apply the CSS palette before paint so Ant and custom surfaces cannot render
  // in different colour modes for a frame during session restoration.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = colorMode;
  }, [colorMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={createRelayTheme(colorMode)}>
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
