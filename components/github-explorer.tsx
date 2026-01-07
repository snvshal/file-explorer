"use client";

import { useState, useEffect } from "react";
import { RepositoryInput } from "./repository-input";
import { LocalFileUpload } from "./local-file-upload";
import { FileTree } from "./file-tree";
import { FilePreview } from "./file-preview";
import { ThemeToggle } from "./theme-toggle";
import type { GitHubFile } from "@/lib/types";

const STORAGE_KEY = "file-explorer-state";

interface StoredState {
  mode: "github" | "local" | null;
  repoUrl: string;
  timestamp: number;
}

export function GitHubExplorer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [explorationMode, setExplorationMode] = useState<
    "github" | "local" | null
  >(null);
  const [localFiles, setLocalFiles] = useState<Map<string, File>>(new Map());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: StoredState = JSON.parse(stored);
        if (state.mode === "github" && state.repoUrl) {
          setRepoUrl(state.repoUrl);
          // Auto-reload GitHub repo if recently accessed
          handleFetchRepository(state.repoUrl);
        }
      } catch (err) {
        console.error("Failed to restore state:", err);
      }
    }
  }, []);

  const handleFetchRepository = async (url: string) => {
    setLoading(true);
    setError("");
    setFiles([]);
    setSelectedFile(null);
    setExplorationMode("github");

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
        throw new Error("Failed to fetch repository files");
      }

      const data = await response.json();
      setFiles(data.files);
      setRepoUrl(url);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: "github",
          repoUrl: url,
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
    fileMap: Map<string, File>,
  ) => {
    setFiles(loadedFiles);
    setLocalFiles(fileMap);
    setSelectedFile(null);
    setError("");
    setRepoUrl("");
    setExplorationMode("local");

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode: "local",
        repoUrl: "",
        timestamp: Date.now(),
      }),
    );
  };

  const handleReset = () => {
    setFiles([]);
    setSelectedFile(null);
    setRepoUrl("");
    setLocalFiles(new Map());
    setExplorationMode(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-border bg-card/50 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
          {/* Top bar with title and theme toggle */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                File Explorer
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Explore GitHub repos or local files instantly
              </p>
            </div>
            <ThemeToggle />
          </div>

          {!explorationMode ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                <div className="flex-1">
                  <label className="text-muted-foreground mb-2 block text-xs">
                    GitHub Repository URL
                  </label>
                  <RepositoryInput
                    onSearch={handleFetchRepository}
                    loading={loading}
                  />
                </div>
                <div className="text-muted-foreground hidden h-full items-end px-2 pb-2 sm:flex">
                  or
                </div>
                <div className="flex-1">
                  <label className="text-muted-foreground mb-2 block text-xs">
                    Upload Local Directory
                  </label>
                  <LocalFileUpload
                    onFilesLoaded={handleLocalFiles}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                {explorationMode === "github" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="bg-primary/20 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                      GitHub Repo
                    </span>
                    <span className="text-muted-foreground truncate text-xs sm:text-sm">
                      {repoUrl}
                    </span>
                  </div>
                )}
                {explorationMode === "local" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="bg-secondary/20 text-secondary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                      Local Files
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      {files.length} items
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/20 w-full rounded-lg px-4 py-2 text-xs transition-colors sm:w-auto sm:text-sm"
              >
                Change Source
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="bg-destructive/10 border-destructive/50 text-destructive rounded-lg border p-4 text-sm">
              {error}
            </div>
          </div>
        )}

        {files.length > 0 ? (
          <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-3 overflow-hidden px-4 py-3 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-3">
            {/* File Tree */}
            <div className="min-h-0 lg:col-span-1">
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
              />
            </div>

            {/* File Preview */}
            <div className="min-h-0 lg:col-span-2">
              <FilePreview file={selectedFile} localFiles={localFiles} />
            </div>
          </div>
        ) : (
          !loading &&
          !explorationMode && (
            <div className="flex h-full items-center justify-center">
              <div className="px-4 text-center">
                <div className="bg-card mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg">
                  <svg
                    className="text-muted-foreground h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.523 0 10-4.998 10-11.247S17.523 6.253 12 6.253z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Choose a GitHub repository or upload a local directory
                </p>
              </div>
            </div>
          )
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
