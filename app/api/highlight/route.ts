import { codeToHtml } from "shiki";

export async function POST(request: Request) {
  try {
    const { code, lang = "text", theme } = await request.json();

    const shikiTheme = theme === "light" ? "github-light" : "github-dark";

    const html = await codeToHtml(code, {
      lang,
      theme: shikiTheme,
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
