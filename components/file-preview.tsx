"use client";

import { useState, useEffect, useRef } from "react";
import { CodeHighlighter } from "./code-highlighter";
import { MarkdownRenderer } from "./markdown-renderer";
import type { GitHubFile } from "@/lib/types";
import { Eye, Code, Copy, WrapText, Check, X } from "lucide-react";
import {
  formatFileSize,
  isImageFile,
  isVideoFile,
  isAudioFile,
} from "@/lib/file-utils";

interface FilePreviewProps {
  file: GitHubFile | null;
  localFiles?: Map<string, FileSystemFileHandle>;
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
  const [localFileSize, setLocalFileSize] = useState<number | null>(null);
  const [selectionState, setSelectionState] = useState<{
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    // Reset selection when file changes
    setSelectionState(null);
  }, [file]);

  useEffect(() => {
    if (!file || file.type === "dir") {
      setContent("");
      setMediaUrl("");
      setError("");
      setLocalFileSize(null);
      return;
    }

    setLoading(true);
    setError("");
    setMarkdownView("preview");
    setMediaUrl("");
    setLocalFileSize(null);

    const fetchContent = async () => {
      try {
        const isLocalFile = localFiles && localFiles.has(file.path);

        if (isLocalFile) {
          const fileHandle = localFiles.get(file.path);
          if (!fileHandle) throw new Error("File not found");

          const fileObj = await fileHandle.getFile();
          setLocalFileSize(fileObj.size);

          if (
            isImageFile(file.name) ||
            isVideoFile(file.name) ||
            isAudioFile(file.name)
          ) {
            const url = URL.createObjectURL(fileObj);
            setMediaUrl(url);
            setContent("");
          } else {
            const text = await fileObj.text();
            setContent(text);
          }
        } else {
          // GitHub Mode
          if (
            isImageFile(file.name) ||
            isVideoFile(file.name) ||
            isAudioFile(file.name)
          ) {
            const mediaUrl = (file as any).rawUrl || file.url;
            setMediaUrl(mediaUrl);
            setContent("");
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
  const isAudio = file && isAudioFile(file.name);

  // clean up blob URLs when they change/unmount
  const prevMediaUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      prevMediaUrlRef.current &&
      prevMediaUrlRef.current.startsWith("blob:") &&
      prevMediaUrlRef.current !== mediaUrl
    ) {
      URL.revokeObjectURL(prevMediaUrlRef.current);
    }
    prevMediaUrlRef.current = mediaUrl;
    return () => {
      if (
        prevMediaUrlRef.current &&
        prevMediaUrlRef.current.startsWith("blob:")
      ) {
        URL.revokeObjectURL(prevMediaUrlRef.current);
      }
    };
  }, [mediaUrl]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLineClick = (line: number) => {
    setSelectionState((prev) => {
      if (!prev) {
        // First click: Start selection (single line)
        return { start: line, end: line };
      }

      const { start, end } = prev;

      if (line < start) {
        // Click above start: Extend selection upward
        return { start: line, end };
      } else if (line > end) {
        // Click below end: Extend selection downward
        return { start, end: line };
      } else if (line === start) {
        // Click on start line
        if (start === end) {
          // If single line selected, deselect
          return null;
        } else {
          // Shrink selection from top
          return { start: line + 1, end };
        }
      } else if (line === end) {
        // Click on end line (and start != end, covered above)
        // Shrink selection from bottom
        return { start, end: line - 1 };
      }

      // Click inside selection (not boundaries): Do nothing
      return prev;
    });
  };

  const handleCopyContent = async () => {
    try {
      let textToCopy = content;

      if (selectionState) {
        const lines = content.split("\n");
        // Ensure bounds are valid
        const startLine = Math.max(1, selectionState.start);
        const endLine = Math.min(lines.length, selectionState.end);

        const selectedLines = lines.slice(startLine - 1, endLine);
        textToCopy = selectedLines.join("\n");
      }

      await navigator.clipboard.writeText(textToCopy);

      setCopySuccess(true);
      // Clear selection after copy
      setSelectionState(null);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setCopySuccess(false);
        timeoutRef.current = null;
      }, 2000);
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
            {formatFileSize(localFileSize ?? file.size)}
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
          {!isImage && !isVideo && !isAudio && !loading && !error && (
            <>
              {(!isMarkdown || markdownView !== "preview") && (
                <button
                  onClick={() => setCodeWrap((v) => !v)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded p-2 transition-colors"
                  title="Toggle wrap"
                >
                  <WrapText className="h-4 w-4" />
                </button>
              )}
              {selectionState ? (
                <div className="bg-primary/10 border-primary/20 flex items-center gap-0.5 rounded-md border p-0.5">
                  <button
                    onClick={handleCopyContent}
                    className={`rounded p-1.5 transition-colors ${
                      copySuccess
                        ? "bg-green-500/20 text-green-500"
                        : "text-primary hover:bg-primary/10"
                    }`}
                    title="Copy selected lines"
                  >
                    {copySuccess ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <div className="bg-primary/20 h-4 w-[1px]" />
                  <button
                    onClick={() => setSelectionState(null)}
                    className="text-primary/70 hover:text-primary hover:bg-primary/10 rounded p-1.5 transition-colors"
                    title="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCopyContent}
                  className={`rounded p-2 transition-colors ${
                    copySuccess
                      ? "bg-green-500/20 text-green-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  }`}
                  title="Copy file content"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
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
        ) : isAudio && mediaUrl ? (
          <div className="flex min-h-full items-center justify-center p-4">
            <audio
              src={mediaUrl}
              controls
              className="border-border w-full rounded-full border md:mx-8"
            />
          </div>
        ) : isMarkdown && markdownView === "preview" ? (
          <div className="p-3 sm:p-4">
            <MarkdownRenderer
              content={content}
              repoOwner={
                typeof window !== "undefined"
                  ? localStorage.getItem("current-repo-owner") || undefined
                  : undefined
              }
              repoName={
                typeof window !== "undefined"
                  ? localStorage.getItem("current-repo-name") || undefined
                  : undefined
              }
              filePath={file.path}
            />
          </div>
        ) : (
          <CodeHighlighter
            code={content}
            filename={file.name}
            wrap={codeWrap}
            selectedRange={selectionState}
            onLineClick={handleLineClick}
          />
        )}
      </div>
    </div>
  );
}
