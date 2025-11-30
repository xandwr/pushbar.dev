import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
        <ClerkProvider
            appearance={{
                baseTheme: undefined,
                variables: {
                    colorPrimary: "#34d399",
                    colorBackground: "#18181b",
                    colorText: "#ffffff",
                    colorInputBackground: "#27272a",
                    colorInputText: "#ffffff",
                    colorTextSecondary: "#a1a1aa",
                    colorNeutral: "#ffffff",
                },
                elements: {
                    formButtonPrimary:
                        "bg-emerald-500 hover:bg-emerald-600 text-white",
                    card: "bg-zinc-900 border border-zinc-800",
                    headerTitle: "text-white",
                    headerSubtitle: "text-zinc-400",
                    socialButtonsBlockButton:
                        "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                    socialButtonsBlockButtonText: "text-white",
                    dividerLine: "bg-zinc-700",
                    dividerText: "text-zinc-400",
                    formFieldLabel: "text-zinc-300",
                    formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
                    footerActionLink: "text-emerald-400 hover:text-emerald-300",
                    footerActionText: "text-zinc-400",
                },
            }}
        >
            <html lang="en" className="dark">
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-zinc-100`}
                >
                    {/* Persistent 3D background */}
                    <div className="fixed inset-0 z-0">
                        <Globe />
                    </div>
                    <Navbar />
                    <main className="relative z-10 pt-14 h-screen overflow-hidden">
                        <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
                            {children}
                        </div>
                    </main>
                </body>
            </html>
        </ClerkProvider>
    );
}
