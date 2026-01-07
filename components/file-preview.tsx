"use client"

import { useState, useEffect } from "react"
import { CodeHighlighter } from "./code-highlighter"
import { MarkdownRenderer } from "./markdown-renderer"
import type { GitHubFile } from "@/lib/types"
import { Eye, Code, Copy, WrapText } from "lucide-react"
import { formatFileSize, isImageFile, isVideoFile } from "@/lib/file-utils"

interface FilePreviewProps {
  file: GitHubFile | null
  localFiles?: Map<string, File>
}

export function FilePreview({ file, localFiles }: FilePreviewProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [markdownView, setMarkdownView] = useState<"preview" | "code">("preview")
  const [mediaUrl, setMediaUrl] = useState<string>("")
  const [codeWrap, setCodeWrap] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (!file || file.type === "dir") {
      setContent("")
      setMediaUrl("")
      setError("")
      return
    }

    setLoading(true)
    setError("")
    setMarkdownView("preview")
    setMediaUrl("")

    const fetchContent = async () => {
      try {
        const isLocalFile = localFiles && localFiles.has(file.path)

        if (isImageFile(file.name) || isVideoFile(file.name)) {
          if (isLocalFile) {
            const fileObj = localFiles.get(file.path)
            if (!fileObj) throw new Error("File not found")
            const url = URL.createObjectURL(fileObj)
            setMediaUrl(url)
          } else {
            const response = await fetch(`/api/github/file?url=${encodeURIComponent(file.url)}`)
            if (!response.ok) throw new Error("Failed to fetch file")
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setMediaUrl(url)
          }
          setContent("")
        } else {
          if (isLocalFile) {
            const fileObj = localFiles.get(file.path)
            if (!fileObj) throw new Error("File not found")
            const text = await fileObj.text()
            setContent(text)
          } else {
            const response = await fetch(`/api/github/file?url=${encodeURIComponent(file.url)}`)
            if (!response.ok) throw new Error("Failed to fetch file")
            const text = await response.text()
            setContent(text)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading file")
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [file, localFiles])

  const isMarkdown = file?.name.toLowerCase().endsWith(".md")
  const isImage = file && isImageFile(file.name)
  const isVideo = file && isVideoFile(file.name)

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (!file) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a file to preview</p>
      </div>
    )
  }

  if (file.type === "dir") {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{file.name} is a directory</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-mono text-secondary truncate">{file.path}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.size)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isMarkdown && !loading && !error && (
            <>
              <button
                onClick={() => setMarkdownView("preview")}
                className={`p-2 rounded transition-colors ${
                  markdownView === "preview"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMarkdownView("code")}
                className={`p-2 rounded transition-colors ${
                  markdownView === "code"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
                title="Source Code"
              >
                <Code className="w-4 h-4" />
              </button>
            </>
          )}
          {!isImage && !isVideo && !loading && !error && (
            <>
              <button
                onClick={() => setCodeWrap(!codeWrap)}
                className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                title="Toggle wrap"
              >
                <WrapText className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyContent}
                className={`p-2 rounded transition-colors ${
                  copySuccess
                    ? "bg-green-500/20 text-green-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">Loading file...</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : isImage && mediaUrl ? (
          <div className="p-4 flex items-center justify-center min-h-full">
            <img
              src={mediaUrl || "/placeholder.svg"}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg border border-border"
            />
          </div>
        ) : isVideo && mediaUrl ? (
          <div className="p-4 flex items-center justify-center min-h-full">
            <video src={mediaUrl} controls className="max-w-full max-h-full rounded-lg border border-border" />
          </div>
        ) : isMarkdown ? (
          markdownView === "preview" ? (
            <div className="p-3 sm:p-4">
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <CodeHighlighter code={content} filename={file.name} wrap={codeWrap} />
          )
        ) : (
          <CodeHighlighter code={content} filename={file.name} wrap={codeWrap} />
        )}
      </div>
    </div>
  )
}
