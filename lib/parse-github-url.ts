export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  isValid: boolean;
  error?: string;
}

export function parseGitHubUrl(pathOrUrl: string): ParsedGitHubUrl {
  try {
    // Handle both full URLs and encoded paths
    let urlString = pathOrUrl;

    // If it starts with encoded github.com, decode it
    if (pathOrUrl.includes("%")) {
      urlString = decodeURIComponent(pathOrUrl);
    }

    // Support both github.com URLs and direct paths
    const githubMatch = urlString.match(
      /(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)(?:\/(?:blob|tree)\/([^/]+))?(?:\/(.*))?/i,
    );

    if (!githubMatch) {
      return {
        owner: "",
        repo: "",
        branch: "main",
        filePath: "",
        isValid: false,
        error: "Invalid GitHub URL format",
      };
    }

    const owner = githubMatch[1];
    const repo = githubMatch[2];
    const branch = githubMatch[3] || "main";
    const filePath = githubMatch[4] || "";

    if (!owner || !repo) {
      return {
        owner: "",
        repo: "",
        branch: "main",
        filePath: "",
        isValid: false,
        error: "Missing owner or repository name",
      };
    }

    return {
      owner,
      repo,
      branch,
      filePath,
      isValid: true,
    };
  } catch (err) {
    return {
      owner: "",
      repo: "",
      branch: "main",
      filePath: "",
      isValid: false,
      error: "Failed to parse GitHub URL",
    };
  }
}
