import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner");
  const repo = request.nextUrl.searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameter" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Repository not found or is private" },
        { status: response.status },
      );
    }

    const data = await response.json();

    const files = data.tree.map((item: any) => ({
      name: item.path.split("/").pop(),
      path: item.path,
      type: item.type === "tree" ? "dir" : "file",
      size: item.size || 0,
      url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`, // directly use raw URL instead of git API URL
      rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`,
    }));

    return NextResponse.json({ files, owner, repo });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 },
    );
  }
}
