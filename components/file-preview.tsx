"use client";

import { useState, useEffect } from "react";
import { CodeHighlighter } from "./code-highlighter";
import { MarkdownRenderer } from "./markdown-renderer";
import type { GitHubFile } from "@/lib/types";
import { Eye, Code, Copy, WrapText } from "lucide-react";
import { formatFileSize, isImageFile, isVideoFile } from "@/lib/file-utils";

interface FilePreviewProps {
  file: GitHubFile | null;
  localFiles?: Map<string, File>;
}

export function FilePreview({ file, localFiles }: FilePreviewProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markdownView, setMarkdownView] = useState<"preview" | "code">(
    "preview",
  );
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [codeWrap, setCodeWrap] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!file || file.type === "dir") {
      setContent("");
      setMediaUrl("");
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setMarkdownView("preview");
    setMediaUrl("");

    const fetchContent = async () => {
      try {
        const isLocalFile = localFiles && localFiles.has(file.path);

        if (isImageFile(file.name) || isVideoFile(file.name)) {
          if (isLocalFile) {
            const fileObj = localFiles.get(file.path);
            if (!fileObj) throw new Error("File not found");
            const url = URL.createObjectURL(fileObj);
            setMediaUrl(url);
          } else {
            const response = await fetch(
              `/api/github/file?url=${encodeURIComponent(file.url)}`,
            );
            if (!response.ok) throw new Error("Failed to fetch file");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setMediaUrl(url);
          }
          setContent("");
        } else {
          if (isLocalFile) {
            const fileObj = localFiles.get(file.path);
            if (!fileObj) throw new Error("File not found");
            const text = await fileObj.text();
            setContent(text);
          } else {
            const response = await fetch(
              `/api/github/file?url=${encodeURIComponent(file.url)}`,
            );
            if (!response.ok) throw new Error("Failed to fetch file");
            const text = await response.text();
            setContent(text);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading file");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file, localFiles]);

  const isMarkdown = file?.name.toLowerCase().endsWith(".md");
  const isImage = file && isImageFile(file.name);
  const isVideo = file && isVideoFile(file.name);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!file) {
    return (
      <div className="bg-card border-border flex h-full items-center justify-center rounded-lg border p-6">
        <p className="text-muted-foreground text-sm">
          Select a file to preview
        </p>
      </div>
    );
  }

  if (file.type === "dir") {
    return (
      <div className="bg-card border-border flex h-full items-center justify-center rounded-lg border p-6">
        <p className="text-muted-foreground text-sm">
          {file.name} is a directory
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border flex h-full flex-col overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="border-border bg-card/50 sticky top-0 z-10 flex flex-shrink-0 items-center justify-between gap-2 border-b px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-secondary truncate font-mono text-xs sm:text-sm">
            {file.path}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {formatFileSize(file.size)}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {isMarkdown && !loading && !error && (
            <>
              <button
                onClick={() => setMarkdownView("preview")}
                className={`rounded p-2 transition-colors ${
                  markdownView === "preview"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMarkdownView("code")}
                className={`rounded p-2 transition-colors ${
                  markdownView === "code"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
                title="Source Code"
              >
                <Code className="h-4 w-4" />
              </button>
            </>
          )}
          {!isImage && !isVideo && !loading && !error && (
            <>
              <button
                onClick={() => setCodeWrap(!codeWrap)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded p-2 transition-colors"
                title="Toggle wrap"
              >
                <WrapText className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopyContent}
                className={`rounded p-2 transition-colors ${
                  copySuccess
                    ? "bg-green-500/20 text-green-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading file...</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : isImage && mediaUrl ? (
          <div className="flex min-h-full items-center justify-center p-4">
            <img
              src={mediaUrl || "/placeholder.svg"}
              alt={file.name}
              className="border-border max-h-full max-w-full rounded-lg border object-contain"
            />
          </div>
        ) : isVideo && mediaUrl ? (
          <div className="flex min-h-full items-center justify-center p-4">
            <video
              src={mediaUrl}
              controls
              className="border-border max-h-full max-w-full rounded-lg border"
            />
          </div>
        ) : isMarkdown ? (
          markdownView === "preview" ? (
            <div className="p-3 sm:p-4">
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <CodeHighlighter
              code={content}
              filename={file.name}
              wrap={codeWrap}
            />
          )
        ) : (
          <CodeHighlighter
            code={content}
            filename={file.name}
            wrap={codeWrap}
          />
        )}
      </div>
    </div>
  );
}
