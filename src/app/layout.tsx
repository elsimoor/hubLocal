import './globals.css';
import Providers from './providers';
import { ThemeProvider } from './theme-provider';
// Import the Inter font from next/font. This exposes a CSS variable
// which we can reference in our global styles. Using a variable means
// the font will load efficiently and can be swapped out for Geist or
// another modern typeface without touching any markup.
import { Inter } from 'next/font/google';

// Instantiate the font with a CSS variable. The `subsets` option tells
// Next.js to include only the characters we need and the `variable`
// option defines a custom CSS variable name.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Apply the Inter variable to the html element so global CSS can reference
    // it. You can switch to Geist or another font by changing the import at
    // the top of this file.
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
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
