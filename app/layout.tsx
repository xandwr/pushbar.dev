import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/navbar";
import { Globe } from "./components/globe";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "pushbar",
    description: "where devs cook",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-zinc-100`}
            >
                {/* Persistent 3D background */}
                <div className="fixed inset-0 z-0">
                    <Globe />
                </div>
                <Navbar />
                <main className="relative z-10 pt-14">{children}</main>
            </body>
        </html>
    );
}
