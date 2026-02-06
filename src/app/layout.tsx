import type { Metadata } from 'next';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { AuthProvider } from '../context/authContext';

export const metadata: Metadata = {
  title: 'ClientPulse',
  description: 'The Strategic Growth Engine',
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
        <AuthProvider>
          <MantineProvider>{children}</MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
