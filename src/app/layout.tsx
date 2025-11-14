import './globals.css';
import Providers from './providers';
import { ThemeProvider } from './theme-provider';
// Import the Inter font from next/font. This exposes a CSS variable
// which we can reference in our global styles. Using a variable means
// the font will load efficiently and can be swapped out for Geist or
// another modern typeface without touching any markup.
import { Inter, Lora, Playfair_Display, Source_Sans_3, Poppins, Fira_Code, Roboto_Mono } from 'next/font/google';

// Instantiate the font with a CSS variable. The `subsets` option tells
// Next.js to include only the characters we need and the `variable`
// option defines a custom CSS variable name.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans' });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['300','400','500','600','700'] });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Apply the Inter variable to the html element so global CSS can reference
    // it. You can switch to Geist or another font by changing the import at
    // the top of this file.
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${lora.variable} ${playfair.variable} ${sourceSans.variable} ${poppins.variable} ${firaCode.variable} ${robotoMono.variable}`}>
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
