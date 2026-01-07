"use client";

import type React from "react";
import { useRef, useState } from "react";
import type { GitHubFile } from "@/lib/types";

interface LocalFileUploadProps {
  onFilesLoaded: (files: GitHubFile[], fileMap: Map<string, File>) => void;
  loading?: boolean;
}

export function LocalFileUpload({
  onFilesLoaded,
  loading = false,
}: LocalFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (fileList: FileList) => {
    setIsProcessing(true);

    try {
      const processedFiles: GitHubFile[] = [];
      const fileMap = new Map<string, File>();
      const pathSet = new Set<string>();

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relativePath = file.webkitRelativePath || file.name;

        if (!pathSet.has(relativePath)) {
          pathSet.add(relativePath);
          processedFiles.push({
            name: file.name || relativePath.split("/").pop() || "file",
            path: relativePath,
            type: "file",
            size: file.size,
            url: "",
          });
          fileMap.set(relativePath, file);
        }
      }

      const dirPaths = new Set<string>();
      for (const path of pathSet) {
        const parts = path.split("/");
        for (let i = 1; i < parts.length; i++) {
          const dirPath = parts.slice(0, i).join("/");
          if (!dirPaths.has(dirPath)) {
            dirPaths.add(dirPath);
            processedFiles.push({
              name: parts[i - 1],
              path: dirPath,
              type: "dir",
              size: 0,
              url: "",
            });
          }
        }
      }

      processedFiles.sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "variant",
        });
      });

      onFilesLoaded(processedFiles, fileMap);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const isLoading = loading || isProcessing;

  return (
    <div
      onClick={() => !isLoading && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-lg border-2 border-dashed p-2 transition-colors sm:p-3 ${
        isLoading
          ? "border-muted-foreground/30 bg-card/30 cursor-not-allowed"
          : isDragging
            ? "border-secondary bg-secondary/10 cursor-pointer"
            : "border-border hover:border-muted-foreground bg-card/50 hover:bg-card cursor-pointer"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        webkitdirectory="true"
        onChange={handleFileInput}
        className="hidden"
        disabled={isLoading}
        accept="*"
      />
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <div className="border-border border-t-primary h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2" />
            <span className="text-foreground/70 truncate text-xs sm:text-sm">
              Processing files...
            </span>
          </>
        ) : (
          <>
            <svg
              className="text-muted-foreground h-4 w-4 flex-shrink-0"
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
              Upload Directory
            </span>
          </>
        )}
      </div>
    </div>
  );
}
