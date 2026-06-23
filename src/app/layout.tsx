import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import { AudioAnalyserProvider } from "@/contexts/AudioAnalyserContext";
import AudioPulseButton from "@/components/AudioPulseButton";
import ThemeToggle from "@/components/ThemeToggle";
import WaveShader from "@/components/WaveShader";
import AuthHeader from "@/components/AuthHeader";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SpotiFind",
  description: "Explore music with the Spotify API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AudioAnalyserProvider>
          <FavouritesProvider>
            <div className="container-app">
              {children}
            </div>
            <AuthHeader />
            <AudioPulseButton />
            <ThemeToggle />
            <WaveShader side="left" />
            <WaveShader side="right" />
          </FavouritesProvider>
        </AudioAnalyserProvider>
      </body>
    </html>
  );
}
