"use client";
import { useState } from "react";
import type { GitHubFile } from "@/lib/types";
import { requestDirectoryAccess } from "@/lib/file-system-handler";

interface LocalFileUploadProps {
  onFilesLoaded: (
    files: GitHubFile[],
    fileMap: Map<string, FileSystemFileHandle>,
    dirName: string,
  ) => void;
  loading?: boolean;
}

export function LocalFileUpload({
  onFilesLoaded,
  loading = false,
}: LocalFileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickDirectory = async () => {
    if (isProcessing || loading) return;

    setIsProcessing(true);
    try {
      const { files, fileMap, dirName } = await requestDirectoryAccess();

      onFilesLoaded(files, fileMap, dirName);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access directory";
      if (!message.includes("cancelled")) {
        console.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = loading || isProcessing;

  return (
    <button
      onClick={handlePickDirectory}
      disabled={isLoading}
      className={`w-full rounded-lg border-2 border-dashed p-2 transition-colors sm:p-3 ${
        isLoading
          ? "border-muted-foreground/30 bg-card/30 cursor-not-allowed"
          : "border-border hover:border-muted-foreground bg-card/50 hover:bg-card cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <div className="border-border border-t-primary h-4 w-4 shrink-0 animate-spin rounded-full border-2" />
            <span className="text-foreground/70 truncate text-xs sm:text-sm">
              Processing files...
            </span>
          </>
        ) : (
          <>
            <svg
              className="text-muted-foreground h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-foreground/70 truncate text-xs sm:text-sm">
              Choose Directory
            </span>
          </>
        )}
      </div>
    </button>
  );
}
