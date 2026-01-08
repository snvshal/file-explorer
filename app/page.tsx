import { GitHubExplorer } from "@/components/github-explorer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "GitHub File Explorer - Quick Lookup",
  description:
    "Explore GitHub repository files and local directories with beautiful syntax highlighting and markdown rendering",
};

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <main className="bg-card/50 text-foreground min-h-screen">
        <GitHubExplorer />
      </main>
    </ThemeProvider>
  );
}
