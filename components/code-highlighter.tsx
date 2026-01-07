"use client"

import { useEffect, useMemo, useState } from "react"

interface CodeHighlighterProps {
  code: string
  filename?: string
}

export function CodeHighlighter({ code, filename }: CodeHighlighterProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const getLanguage = (name?: string) => {
    if (!name) return "text"
    const ext = name.split(".").pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: "javascript",
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
    }
    return languageMap[ext!] || "text"
  }

  const language = getLanguage(filename)

  useEffect(() => {
    const highlightCode = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/highlight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, lang: language }),
        })
        const data = await response.json()
        if (data.html) {
          setHighlightedHtml(data.html)
        }
      } catch (error) {
        console.error("Error highlighting code:", error)
        // Fallback: display code without highlighting
        setHighlightedHtml(`<pre><code>${escapeHtml(code)}</code></pre>`)
      } finally {
        setLoading(false)
      }
    }

    highlightCode()
  }, [code, language])

  const lines = useMemo(() => code.split("\n"), [code])
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  if (loading) {
    return (
      <div className="bg-background text-foreground font-mono text-xs sm:text-sm flex items-center justify-center h-32">
        <p className="text-muted-foreground">Highlighting code...</p>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground font-mono text-xs sm:text-sm h-full overflow-auto">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-b border-border/20 hover:bg-accent/5 transition-colors">
                <td className="sticky left-0 bg-background/50 text-muted-foreground select-none px-2 sm:px-4 py-1 text-right min-w-fit border-r border-border/20">
                  {index + 1}
                </td>
                <td className="px-2 sm:px-4 py-1 w-full">
                  <code className="text-foreground">{line || "\n"}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
