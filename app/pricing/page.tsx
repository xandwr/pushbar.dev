"use client";

import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
    return (
        <div className="relative h-full overflow-auto">
            <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-4 py-12">
                <h1 className="text-4xl md:text-5xl font-mono font-bold text-zinc-100 mb-2 text-center">
                    <span className="text-emerald-400">&gt;</span> member card
                    <span className="animate-pulse text-emerald-400">_</span>
                </h1>
                <p className="text-zinc-500 font-mono text-base md:text-lg text-center max-w-md mb-8">
                    $1/month to unlock pushbar
                </p>
                <div className="w-full max-w-md">
                    <PricingTable />
                </div>
            </div>
        </div>
    );
}
