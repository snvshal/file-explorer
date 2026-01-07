"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";

interface CodeHighlighterProps {
  code: string;
  filename?: string;
  wrap?: boolean;
}

export function CodeHighlighter({
  code,
  filename,
  wrap = true,
}: CodeHighlighterProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getLanguage = (name?: string) => {
    if (!name) return "text";
    const ext = name.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: "javascript",
      mjs: "javascript",
      cjs: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      rb: "ruby",
      php: "php",
      go: "go",
      rs: "rust",
      sql: "sql",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      sh: "bash",
      bash: "bash",
      java: "java",
      cpp: "cpp",
      c: "c",
      kt: "kotlin",
      swift: "swift",
    };
    return languageMap[ext!] || "text";
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const language = getLanguage(filename);

  useEffect(() => {
    const highlightCode = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/highlight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, lang: language }),
        });
        const data = await response.json();
        if (data.html) {
          setHighlightedHtml(data.html);
        }
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback: display code without highlighting
        setHighlightedHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
      } finally {
        setLoading(false);
      }
    };
    highlightCode();
  }, [code, language]);

  // Extract lines from the highlighted HTML
  const highlightedLines = useMemo(() => {
    if (!highlightedHtml) return [];

    // Parse the HTML to extract code lines
    const parser = new DOMParser();
    const doc = parser.parseFromString(highlightedHtml, "text/html");
    const codeElement = doc.querySelector("code");

    if (!codeElement) return [];

    // Get the HTML content and split by line breaks
    const innerHTML = codeElement.innerHTML;
    const lines = innerHTML.split("\n");

    return lines;
  }, [highlightedHtml]);

  if (loading) {
    return (
      <div className="bg-background text-foreground flex h-32 items-center justify-center font-mono text-xs sm:text-sm">
        <p className="text-muted-foreground">Highlighting code...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-background text-foreground h-full font-mono text-xs sm:text-sm",
        wrap ? "overflow-auto" : "overflow-x-auto",
      )}
    >
      <div className={cn("inline-block", wrap ? "w-full" : "min-w-full")}>
        <table className="w-full border-collapse">
          <tbody>
            {highlightedLines.map((lineHtml, index) => (
              <tr
                key={index}
                className="border-border/20 hover:bg-accent/5 border-b transition-colors"
              >
                <td className="bg-background text-muted-foreground border-border/20 sticky left-0 min-w-fit border-r px-2 py-1 text-right align-top select-none sm:px-4">
                  {index + 1}
                </td>
                <td
                  className={cn(
                    "px-2 py-1 sm:px-4",
                    wrap ? "break-all whitespace-pre-wrap" : "whitespace-pre",
                  )}
                >
                  <code
                    className="block"
                    dangerouslySetInnerHTML={{ __html: lineHtml || "<br/>" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
