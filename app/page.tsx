export default function Home() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <h1 className="text-5xl md:text-7xl font-mono font-bold text-zinc-100 mb-4 text-center">
                    <span className="text-emerald-400">&gt;</span> pushbar
                    <span className="animate-pulse text-emerald-400">_</span>
                </h1>
                <p className="text-zinc-500 font-mono text-lg md:text-xl text-center max-w-md">
                    where devs cook
                </p>

                {/* Subtle hint text */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <p className="text-zinc-700 font-mono text-xs">
                        <span className="text-zinc-600">$</span> visit{" "}
                        <span className="text-emerald-400/60">[username]</span>.pushbar.dev
                    </p>
                </div>
            </div>

            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/50 pointer-events-none z-1" />
        </div>
    );
}
