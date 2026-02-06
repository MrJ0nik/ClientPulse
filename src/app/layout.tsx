import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@/src/app/globals.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import StoreProvider from "./StoreProvider";

export const metadata: Metadata = {
  title: "ClientPulse",
  description: "The Strategic Growth Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <StoreProvider>
          <MantineProvider>{children}</MantineProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
