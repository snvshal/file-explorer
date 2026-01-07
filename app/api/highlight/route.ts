import { codeToHtml } from "shiki";

export async function POST(request: Request) {
  try {
    const { code, lang = "text" } = await request.json();

    const html = await codeToHtml(code, {
      lang,
      theme: "github-dark",
    });

    return Response.json({ html });
  } catch (error) {
    console.error("Highlighting error:", error);
    return Response.json(
      { error: "Failed to highlight code" },
      { status: 500 },
    );
  }
}
