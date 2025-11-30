import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
    const user = await currentUser();

    // Get GitHub username from external accounts
    const githubAccount = user?.externalAccounts?.find(
        (account) => account.provider === "oauth_github"
    );
    const githubUsername = githubAccount?.username;

    return (
        <div className="relative h-full overflow-hidden">
            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                <h1 className="text-5xl md:text-7xl font-mono font-bold text-zinc-100 mb-4 text-center">
                    <span className="text-emerald-400">&gt;</span> pushbar
                    <span className="animate-pulse text-emerald-400">_</span>
                </h1>
                <p className="text-zinc-500 font-mono text-lg md:text-xl text-center max-w-md">
                    {githubUsername ? (
                        <a
                            href={`/u/${githubUsername}`}
                            className="hover:text-emerald-400 transition-colors"
                        >
                            {githubUsername}.pushbar.dev
                        </a>
                    ) : (
                        "[username].pushbar.dev"
                    )}
                </p>
            </div>
        </div>
    );
}
