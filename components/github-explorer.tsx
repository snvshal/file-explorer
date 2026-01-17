"use client";

import { useState, useEffect, useCallback } from "react";
import { RepositoryInput } from "./repository-input";
import { LocalFileUpload } from "./local-file-upload";
import { FileTree } from "./file-tree";
import { FilePreview } from "./file-preview";
import { ThemeToggle } from "./theme-toggle";
import type { GitHubFile } from "@/lib/types";
import {
  restoreDirectoryAccess,
  readDirectory,
} from "@/lib/file-system-handler";
import Image from "next/image";

const STORAGE_KEY = "file-explorer-state";

interface StoredState {
  mode: "github" | "local" | null;
  repoUrl: string;
  repoName: string;
  dirName: string;
  timestamp: number;
}

interface GitHubExplorerProps {
  initialUrl?: string;
  initialFilePath?: string;
  urlError?: string;
}

export function GitHubExplorer({
  initialUrl = "",
  initialFilePath = "",
  urlError = "",
}: GitHubExplorerProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoName, setRepoName] = useState("");
  const [dirName, setDirName] = useState("");
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError);
  const [explorationMode, setExplorationMode] = useState<
    "github" | "local" | null
  >(null);
  const [localFiles, setLocalFiles] = useState<
    Map<string, FileSystemFileHandle>
  >(new Map());

  useEffect(() => {
    const initializeApp = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const state: StoredState = JSON.parse(stored);
          if (state.mode === "github" && state.repoUrl && state.repoName) {
            setRepoUrl(state.repoUrl);
            setRepoName(state.repoName);
            handleFetchRepository(state.repoUrl);
          } else if (state.mode === "local" && state.dirName) {
            const restored = await restoreDirectoryAccess();
            if (restored) {
              setDirName(restored.dirName);
              setFiles(restored.files);
              setLocalFiles(restored.fileMap);
              setExplorationMode("local");
            }
          }
        } catch (err) {
          console.error("Failed to restore state:", err);
        }
      }
    };

    initializeApp();

    if (initialUrl) {
      handleFetchRepository(initialUrl);
    }
  }, [initialUrl]);

  const findFileByPath = useCallback(
    (fileList: GitHubFile[], targetPath: string): GitHubFile | null => {
      for (const file of fileList) {
        if (file.path === targetPath || file.path === `/${targetPath}`) {
          return file;
        }
        if (file.type === "dir" && file.children) {
          const found = findFileByPath(file.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  useEffect(() => {
    if (initialFilePath && files.length > 0 && !selectedFile) {
      const fileToSelect = findFileByPath(files, initialFilePath);
      if (fileToSelect) {
        setSelectedFile(fileToSelect);
      } else {
        setError(`File not found: ${initialFilePath}`);
      }
    }
  }, [files, initialFilePath, selectedFile, findFileByPath]);

  const handleFetchRepository = async (url: string) => {
    setLoading(true);
    setError("");
    setFiles([]);
    setSelectedFile(null);
    setExplorationMode("github");
    setDirName("");

    try {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)(\/.*)?/);
      if (!match) {
        throw new Error("Invalid GitHub URL format");
      }

      const [, owner, repo] = match;
      const response = await fetch(
        `/api/github/files?owner=${owner}&repo=${repo}`,
      );

      if (!response.ok) {
        if (response.status === 504) {
          throw new Error("Gateway Timeout: Please try later");
        }
        throw new Error("Failed to fetch repository files");
      }

      const data = await response.json();
      setFiles(data.files);
      setRepoUrl(url);
      setRepoName(repo);

      // Store repo info for image resolution in markdown
      localStorage.setItem("current-repo-owner", owner);
      localStorage.setItem("current-repo-name", repo);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: "github",
          repoUrl: url,
          repoName: repo,
          dirName: "",
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalFiles = (
    loadedFiles: GitHubFile[],
    fileMap: Map<string, FileSystemFileHandle>,
    dirName: string,
  ) => {
    setFiles(loadedFiles);
    setLocalFiles(fileMap);
    setDirName(dirName);
    setSelectedFile(null);
    setError("");
    setRepoUrl("");
    setRepoName("");
    setExplorationMode("local");

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode: "local",
        repoUrl: "",
        repoName: "",
        dirName: dirName,
        timestamp: Date.now(),
      }),
    );
  };

  const handleExpandFolder = async (path: string) => {
    if (explorationMode !== "local") return;

    try {
      const { files: newFiles, fileMap: newFileMap } =
        await readDirectory(path);

      setFiles((prev) => {
        const existingPaths = new Set(prev.map((f) => f.path));
        const uniqueNewFiles = newFiles.filter(
          (f) => !existingPaths.has(f.path),
        );
        if (uniqueNewFiles.length === 0) return prev;
        return [...prev, ...uniqueNewFiles];
      });

      setLocalFiles((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [k, v] of newFileMap) {
          if (!next.has(k)) {
            next.set(k, v);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    } catch (err) {
      console.error(`Failed to load directory ${path}:`, err);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setSelectedFile(null);
    setRepoUrl("");
    setRepoName("");
    setDirName("");
    setLocalFiles(new Map());
    setExplorationMode(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("current-repo-owner");
    localStorage.removeItem("current-repo-name");
  };

  return (
    <div className="bg-background selection:bg-primary/20 flex h-screen flex-col">
      {!explorationMode ? (
        <div className="animate-in fade-in flex flex-1 flex-col items-center justify-center p-4 duration-500 sm:p-8">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-2xl space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="from-foreground to-muted-foreground bg-linear-to-br bg-clip-text pb-1 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                GitHub File Explorer
              </h1>
              <p className="text-muted-foreground mx-auto max-w-lg text-lg leading-relaxed sm:text-xl">
                Instantly browse, read, and explore code repositories with a
                beautiful, native-like experience.
              </p>
            </div>

            <div className="bg-card/50 border-border/50 shadow-primary/5 rounded-2xl border p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="space-y-3">
                  <div className="text-foreground/80 flex items-center gap-2 text-sm font-medium">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    Explore GitHub Repository
                  </div>
                  <RepositoryInput
                    onSearch={handleFetchRepository}
                    loading={loading}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="border-border/50 w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                      Or upload local
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <LocalFileUpload
                    onFilesLoaded={handleLocalFiles}
                    loading={loading}
                  />
                </div>
              </div>
            </div>

            <div className="text-muted-foreground/60 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
                No login required
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                Browser-based
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500/50" />
                Open Source
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-border bg-card/80 sticky top-0 z-10 border-b backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={handleReset}
                  className="flex cursor-pointer items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                  title="Back to Home"
                >
                  <Image
                    src="/icon.png"
                    width={20}
                    height={20}
                    alt="SNFE icon"
                  />
                  <span className="hidden uppercase sm:inline">snfe</span>
                </button>

                <div className="bg-border mx-1 h-4 w-px" />

                {explorationMode === "github" ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-blue-500">
                      GitHub
                    </span>
                    {/* <span className="truncate text-sm text-muted-foreground font-medium">
                      {repoName}
                    </span> */}
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-orange-500">
                      Local
                    </span>
                    {/* <span className="truncate text-sm text-muted-foreground font-medium">
                      {dirName}
                    </span> */}
                  </div>
                )}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="bg-destructive/10 border-destructive/50 text-destructive rounded-lg border p-4 text-sm">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && explorationMode && (
          <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-3 overflow-hidden px-4 py-3 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-3">
            {/* File Tree */}
            <div className="min-h-0 lg:col-span-1">
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                sourceTitle={explorationMode === "github" ? repoName : dirName}
                onExpandFolder={
                  explorationMode === "local" ? handleExpandFolder : undefined
                }
              />
            </div>

            {/* File Preview */}
            <div className="min-h-0 lg:col-span-2">
              <FilePreview file={selectedFile} localFiles={localFiles} />
            </div>
          </div>
        )}

        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="border-border border-t-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2"></div>
              <p className="text-muted-foreground text-sm">Loading files...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
