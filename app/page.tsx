"use client";

import { GitHubExplorer } from "@/components/github-explorer";
import { useGitHubStore } from "@/lib/github-store";

export default function Home() {
  const { initialUrl, initialFilePath, urlError } = useGitHubStore();

  return (
    <main className="bg-card/50 text-foreground min-h-screen">
      <GitHubExplorer
        initialUrl={initialUrl}
        initialFilePath={initialFilePath}
        urlError={urlError}
      />
    </main>
  );
}
