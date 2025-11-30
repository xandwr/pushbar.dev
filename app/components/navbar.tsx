"use client";

import Link from "next/link";
import { useState } from "react";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
} from "@clerk/nextjs";

const navLinks = [
    { href: "/explore", label: "explore" },
    { href: "/pricing", label: "pricing" },
];

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="font-mono text-lg font-bold tracking-tight text-zinc-100 hover:text-emerald-400 transition-colors"
                    >
                        <span className="text-emerald-400">&gt;</span> pushbar
                        <span className="animate-pulse text-emerald-400">_</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 font-mono text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900/50 rounded transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 font-mono text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900/50 rounded transition-all">
                                    login
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="ml-2">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8",
                                        },
                                    }}
                                />
                            </div>
                        </SignedIn>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-zinc-800/50 bg-black/95 backdrop-blur-md">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2 font-mono text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900/50 rounded transition-all"
                            >
                                <span className="text-zinc-600 mr-2">$</span>
                                {link.label}
                            </Link>
                        ))}
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="block w-full text-left px-3 py-2 font-mono text-sm text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900/50 rounded transition-all"
                                >
                                    <span className="text-zinc-600 mr-2">$</span>
                                    login
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="px-3 py-2">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8",
                                        },
                                    }}
                                />
                            </div>
                        </SignedIn>
                    </div>
                </div>
            )}
        </nav>
    );
}
