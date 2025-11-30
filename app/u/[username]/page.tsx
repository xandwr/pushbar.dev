import Image from "next/image";

type Props = {
    params: Promise<{ username: string }>;
};

type GitHubUser = {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    public_repos: number;
    followers: number;
    following: number;
    html_url: string;
    blog: string | null;
    location: string | null;
    company: string | null;
    twitter_username: string | null;
    created_at: string;
};

type GitHubRepo = {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    updated_at: string;
};

async function getGitHubUser(username: string): Promise<GitHubUser | null> {
    try {
        const res = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                Accept: "application/vnd.github.v3+json",
                // Add GitHub token if you have one to avoid rate limits
                ...(process.env.GITHUB_TOKEN && {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                }),
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getGitHubRepos(username: string): Promise<GitHubRepo[]> {
    try {
        const res = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    ...(process.env.GITHUB_TOKEN && {
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    }),
                },
                next: { revalidate: 3600 },
            }
        );

        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function UserWorkspace({ params }: Props) {
    const { username } = await params;

    const [user, repos] = await Promise.all([
        getGitHubUser(username),
        getGitHubRepos(username),
    ]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-mono font-bold text-zinc-100 mb-4">
                        <span className="text-red-500">404</span> user not found
                    </h1>
                    <p className="text-zinc-500 font-mono">
                        <span className="text-zinc-600">$</span> github user{" "}
                        <span className="text-emerald-400">{username}</span> does not exist
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative">
                            <Image
                                src={user.avatar_url}
                                alt={user.name || user.login}
                                width={120}
                                height={120}
                                className="rounded-lg border border-zinc-700"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-3xl font-mono font-bold text-zinc-100">
                                {user.name || user.login}
                            </h1>
                            <a
                                href={user.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 hover:text-emerald-400 font-mono text-sm transition-colors"
                            >
                                @{user.login}
                            </a>
                            {user.bio && (
                                <p className="mt-3 text-zinc-400">{user.bio}</p>
                            )}

                            <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start font-mono text-sm">
                                {user.location && (
                                    <span className="text-zinc-500">
                                        <span className="text-zinc-600">loc:</span> {user.location}
                                    </span>
                                )}
                                {user.company && (
                                    <span className="text-zinc-500">
                                        <span className="text-zinc-600">org:</span> {user.company}
                                    </span>
                                )}
                                {user.blog && (
                                    <a
                                        href={
                                            user.blog.startsWith("http")
                                                ? user.blog
                                                : `https://${user.blog}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        {user.blog}
                                    </a>
                                )}
                                {user.twitter_username && (
                                    <a
                                        href={`https://twitter.com/${user.twitter_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        @{user.twitter_username}
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-8 mt-6 justify-center sm:justify-start font-mono">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {user.public_repos}
                                    </div>
                                    <div className="text-xs text-zinc-600 uppercase tracking-wider">
                                        repos
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-zinc-100">
                                        {user.followers}
                                    </div>
                                    <div className="text-xs text-zinc-600 uppercase tracking-wider">
                                        followers
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-zinc-100">
                                        {user.following}
                                    </div>
                                    <div className="text-xs text-zinc-600 uppercase tracking-wider">
                                        following
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Repositories */}
                {repos.length > 0 && (
                    <div>
                        <h2 className="text-lg font-mono text-zinc-400 mb-4">
                            <span className="text-zinc-600">~/</span>repos
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {repos.map((repo) => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-5 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
                                >
                                    <h3 className="font-mono font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                                        {repo.name}
                                    </h3>
                                    {repo.description && (
                                        <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                                            {repo.description}
                                        </p>
                                    )}
                                    <div className="flex gap-4 mt-3 text-xs font-mono text-zinc-600">
                                        {repo.language && (
                                            <span className="text-zinc-500">{repo.language}</span>
                                        )}
                                        <span>
                                            <span className="text-yellow-500">*</span>{" "}
                                            {repo.stargazers_count}
                                        </span>
                                        <span>
                                            <span className="text-zinc-500">/</span>{" "}
                                            {repo.forks_count}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}