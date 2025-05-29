import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean sans-serif
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Use a more common font name variable
});

// Example of adding Geist fonts if preferred, ensure they are installed or use a CDN.
// For this example, we'll stick with Inter for simplicity as Geist might not be in default Next.js.
// If Geist is available (e.g., via npm install next/font), you can use:
// import { Geist } from 'next/font/google';
// const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
// const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Message Poster App',
  description: 'Create and share beautiful message cards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use --font-inter and a fallback */}
        {children}
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
