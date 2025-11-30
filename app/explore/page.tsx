export default function Explore() {
    return (
        <div className="relative h-full overflow-y-auto">
            <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-mono font-bold text-zinc-100 mb-6">
                    <span className="text-emerald-400">$</span> explore
                </h1>

                {/* Vertical feed - placeholder cards */}
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-lg p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-800" />
                                <div>
                                    <div className="font-mono text-sm text-zinc-100">
                                        @developer
                                    </div>
                                    <div className="font-mono text-xs text-zinc-600">
                                        2h ago
                                    </div>
                                </div>
                            </div>
                            <div className="h-48 bg-zinc-800/50 rounded-lg mb-4 flex items-center justify-center">
                                <span className="text-zinc-600 font-mono text-sm">
                                    content coming soon...
                                </span>
                            </div>
                            <p className="text-zinc-400 text-sm font-mono mb-4">
                                Something cool is being built here.
                            </p>
                            <div className="flex items-center gap-4 text-zinc-600 font-mono text-xs">
                                <span className="hover:text-emerald-400 cursor-pointer transition-colors">
                                    12 stars
                                </span>
                                <span className="hover:text-emerald-400 cursor-pointer transition-colors">
                                    3 comments
                                </span>
                                <span className="hover:text-emerald-400 cursor-pointer transition-colors">
                                    share
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
