"use client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";

interface CodeHighlighterProps {
  code: string;
  filename?: string;
  wrap?: boolean;
  selectedRange?: { start: number; end: number } | null;
  onLineClick?: (lineNumber: number) => void;
}

export function CodeHighlighter({
  code,
  filename,
  wrap = true,
  selectedRange,
  onLineClick,
}: CodeHighlighterProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { theme, resolvedTheme } = useTheme();

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
      java: "java",
      cs: "csharp",
      cpp: "cpp",
      cxx: "cpp",
      hh: "cpp",
      hxx: "cpp",
      c: "c",
      h: "c",
      hpp: "cpp",
      go: "go",
      rs: "rust",
      kt: "kotlin",
      swift: "swift",
      rb: "ruby",
      php: "php",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      json: "json",
      jsonc: "json",
      toml: "toml",
      ini: "ini",
      env: "bash",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      mdx: "mdx",
      rst: "rst",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      fish: "fish",
      ps1: "powershell",
      sql: "sql",
      prisma: "prisma",
      dockerfile: "dockerfile",
      // dockerignore: "ignore",
      // gitignore: "ignore",
      // gitattributes: "ignore",
      lua: "lua",
      r: "r",
      dart: "dart",
      scala: "scala",
      groovy: "groovy",
      perl: "perl",
      vue: "vue",
      svelte: "svelte",
      astro: "astro",
      bat: "batch",
      cmd: "batch",
      graphql: "graphql",
      gql: "graphql",
      proto: "protobuf",
      // lock: "json",
      // config: "javascript",
      conf: "ini",
      ex: "elixir",
      exs: "elixir",
      hs: "haskell",
      tf: "terraform",
      tfvars: "terraform",
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
          body: JSON.stringify({
            code,
            lang: language,
            theme: resolvedTheme ?? theme ?? "dark",
          }),
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
  }, [code, language, resolvedTheme, theme]);

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
      <div className="flex h-32 items-center justify-center font-mono text-xs sm:text-sm">
        <p className="text-muted-foreground">Highlighting code...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card h-full font-mono text-xs sm:text-sm",
        wrap ? "overflow-auto" : "overflow-x-auto",
      )}
    >
      <div className={cn("inline-block", wrap ? "w-full" : "min-w-full")}>
        <span
          className="invisible absolute px-2 text-right font-mono text-xs sm:px-4 sm:text-sm"
          aria-hidden="true"
          ref={(el) => {
            if (el) {
              document.documentElement.style.setProperty(
                "--line-number-width",
                `${el.offsetWidth}px`,
              );
            }
          }}
        >
          {highlightedLines.length}
        </span>

        <table className="w-full border-collapse">
          <tbody>
            {highlightedLines.map((lineHtml, index) => {
              const lineNumber = index + 1;
              const isSelected =
                selectedRange &&
                lineNumber >= selectedRange.start &&
                lineNumber <= selectedRange.end;

              return (
                <tr
                  key={index}
                  onClick={() => onLineClick?.(lineNumber)}
                  className={cn(
                    "flex cursor-pointer border-b transition-colors",
                    isSelected
                      ? "bg-primary/20 hover:bg-primary/30 border-primary/20"
                      : "border-border/20 hover:bg-accent/5",
                  )}
                >
                  <td
                    className={cn(
                      "text-muted-foreground sticky left-0 border-r px-2 py-1 text-right align-top backdrop-blur-2xl select-none sm:px-4",
                      isSelected ? "border-primary/20" : "border-border/20",
                    )}
                    style={{
                      width: "var(--line-number-width)",
                      minWidth: "var(--line-number-width)",
                    }}
                  >
                    {lineNumber}
                  </td>
                  <td
                    className={cn(
                      "flex-1 px-2 py-1 select-none sm:px-4",
                      wrap ? "break-all whitespace-pre-wrap" : "whitespace-pre",
                    )}
                  >
                    <code
                      className="block"
                      dangerouslySetInnerHTML={{ __html: lineHtml || "<br/>" }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
