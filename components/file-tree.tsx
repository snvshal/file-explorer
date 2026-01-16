"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import type { GitHubFile } from "@/lib/types";
import { getFileIcon } from "@/lib/file-utils";

interface FileTreeProps {
  files: GitHubFile[];
  selectedFile: GitHubFile | null;
  onSelectFile: (file: GitHubFile) => void;
  sourceTitle?: string;
  onExpandFolder?: (path: string) => Promise<void>;
}

export function FileTree({
  files,
  selectedFile,
  onSelectFile,
  sourceTitle = "Files",
  onExpandFolder,
}: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleFolder = async (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
      setExpanded(newExpanded);
    } else {
      newExpanded.add(path);
      setExpanded(newExpanded);

      // Lazy load content if handler provided
      if (onExpandFolder) {
        await onExpandFolder(path);
      }
    }
  };

  const getChildren = (path: string): GitHubFile[] => {
    const parentPath = path.endsWith("/") ? path : path + "/";
    return files.filter(
      (file) =>
        file.path.startsWith(parentPath) &&
        file.path.slice(parentPath.length).split("/").length === 1,
    );
  };

  const rootItems = files.filter((file) => !file.path.includes("/"));
  const depth = new Map<string, number>();

  const calculateDepth = (path: string): number => {
    if (depth.has(path)) return depth.get(path)!;
    const d = (path.match(/\//g) || []).length;
    depth.set(path, d);
    return d;
  };

  const sortItems = (items: GitHubFile[]): GitHubFile[] => {
    return items.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      // Then sort by name (case sensitive lexicographical order)
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "variant",
      });
    });
  };

  const renderItems = (items: GitHubFile[], level = 0) => {
    const sortedItems = sortItems(items);

    return sortedItems.map((file) => {
      const isFolder = file.type === "dir";
      const isExpanded = expanded.has(file.path);
      const children = isFolder ? getChildren(file.path) : [];
      const icon = getFileIcon(file.name, isFolder);

      return (
        <div key={file.path}>
          <div
            onClick={() => {
              if (isFolder) {
                toggleFolder(file.path);
              } else {
                onSelectFile(file);
              }
            }}
            className={`group flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors sm:text-sm ${
              selectedFile?.path === file.path
                ? "bg-primary/20 text-primary"
                : "hover:bg-accent/10 text-foreground/70 hover:text-foreground"
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {isFolder && (
              <span className="text-muted-foreground flex h-4 w-4 shrink-0 items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>
            )}
            {!isFolder && <span className="w-4 shrink-0" />}
            <span className="text-foreground/60 group-hover:text-foreground/80 flex h-4 w-4 shrink-0 items-center justify-center">
              {isFolder && isExpanded ? <FolderOpen /> : icon}
            </span>
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            {isFolder && children.length > 0 && (
              <span className="bg-primary/15 text-primary ring-primary/30 ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1">
                {children.length}
              </span>
            )}
          </div>
          {isFolder &&
            isExpanded &&
            children.length > 0 &&
            renderItems(children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="bg-card border-border flex h-full flex-col overflow-hidden rounded-lg border">
      <div className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2 sm:px-4 sm:py-3">
        <h2 className="text-foreground truncate text-xs font-semibold sm:text-sm">
          {sourceTitle}
        </h2>
        <span className="bg-secondary/20 text-secondary ring-secondary/30 shrink-0 rounded-full px-2 py-1 text-xs font-medium ring-1">
          {files.length}
        </span>
      </div>
      <div className="stable-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="py-2">
          {rootItems.length > 0 ? (
            renderItems(rootItems)
          ) : (
            <div className="text-muted-foreground px-4 py-8 text-center text-xs sm:text-sm">
              No files found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
