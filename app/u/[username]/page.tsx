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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        User not found
                    </h1>
                    <p className="text-gray-600">
                        The GitHub user <span className="font-mono">{username}</span> does
                        not exist.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <Image
                            src={user.avatar_url}
                            alt={user.name || user.login}
                            width={120}
                            height={120}
                            className="rounded-full"
                        />
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {user.name || user.login}
                            </h1>
                            <a
                                href={user.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                @{user.login}
                            </a>
                            {user.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}

                            <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                                {user.location && (
                                    <span className="text-gray-600 text-sm">
                                        📍 {user.location}
                                    </span>
                                )}
                                {user.company && (
                                    <span className="text-gray-600 text-sm">
                                        🏢 {user.company}
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
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        🔗 {user.blog}
                                    </a>
                                )}
                                {user.twitter_username && (
                                    <a
                                        href={`https://twitter.com/${user.twitter_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        𝕏 @{user.twitter_username}
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-6 mt-6 justify-center sm:justify-start">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {user.public_repos}
                                    </div>
                                    <div className="text-sm text-gray-500">Repos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {user.followers}
                                    </div>
                                    <div className="text-sm text-gray-500">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {user.following}
                                    </div>
                                    <div className="text-sm text-gray-500">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Repositories */}
                {repos.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Recent Repositories
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {repos.map((repo) => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
                                >
                                    <h3 className="font-semibold text-blue-600 hover:underline">
                                        {repo.name}
                                    </h3>
                                    {repo.description && (
                                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                            {repo.description}
                                        </p>
                                    )}
                                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                                        {repo.language && <span>📝 {repo.language}</span>}
                                        <span>⭐ {repo.stargazers_count}</span>
                                        <span>🍴 {repo.forks_count}</span>
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