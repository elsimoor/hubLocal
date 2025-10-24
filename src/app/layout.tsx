import './globals.css';
import Providers from './providers';
import { ThemeProvider } from './theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/*
          Wrap the application in ThemeProvider so all pages can react to
          theme changes. The Providers component includes the SessionProvider
          for authentication.
        */}
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
