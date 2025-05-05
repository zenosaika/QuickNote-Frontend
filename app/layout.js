import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './context/AuthContext';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: "QuickNote Transcriber",
  description: "Transcribe and summarize audio files quickly and efficiently.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}