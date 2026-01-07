"use client"

import { useState } from "react"
import { RepositoryInput } from "./repository-input"
import { LocalFileUpload } from "./local-file-upload"
import { FileTree } from "./file-tree"
import { FilePreview } from "./file-preview"
import { ThemeToggle } from "./theme-toggle"
import type { GitHubFile } from "@/lib/types"

export function GitHubExplorer() {
  const [repoUrl, setRepoUrl] = useState("")
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [explorationMode, setExplorationMode] = useState<"github" | "local" | null>(null)
  const [localFiles, setLocalFiles] = useState<Map<string, File>>(new Map())

  const handleFetchRepository = async (url: string) => {
    setLoading(true)
    setError("")
    setFiles([])
    setSelectedFile(null)
    setExplorationMode("github")

    try {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)(\/.*)?/)
      if (!match) {
        throw new Error("Invalid GitHub URL format")
      }

      const [, owner, repo] = match
      const response = await fetch(`/api/github/files?owner=${owner}&repo=${repo}`)

      if (!response.ok) {
        throw new Error("Failed to fetch repository files")
      }

      const data = await response.json()
      setFiles(data.files)
      setRepoUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLocalFiles = (loadedFiles: GitHubFile[], fileMap: Map<string, File>) => {
    setFiles(loadedFiles)
    setLocalFiles(fileMap)
    setSelectedFile(null)
    setError("")
    setRepoUrl("")
    setExplorationMode("local")
  }

  const handleReset = () => {
    setFiles([])
    setSelectedFile(null)
    setRepoUrl("")
    setLocalFiles(new Map())
    setExplorationMode(null)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Top bar with title and theme toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                File Explorer
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Explore GitHub repos or local files instantly
              </p>
            </div>
            <ThemeToggle />
          </div>

          {!explorationMode ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-2">GitHub Repository URL</label>
                  <RepositoryInput onSearch={handleFetchRepository} loading={loading} />
                </div>
                <div className="hidden sm:flex text-muted-foreground items-end h-full pb-2 px-2">or</div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-2">Upload Local Directory</label>
                  <LocalFileUpload onFilesLoaded={handleLocalFiles} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                {explorationMode === "github" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      GitHub Repo
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm truncate">{repoUrl}</span>
                  </div>
                )}
                {explorationMode === "local" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                      Local Files
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm">{files.length} items</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-lg transition-colors"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive text-sm">
              {error}
            </div>
          </div>
        )}

        {files.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 h-full max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-6 overflow-hidden">
            {/* File Tree */}
            <div className="lg:col-span-1 min-h-0">
              <FileTree files={files} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
            </div>

            {/* File Preview */}
            <div className="lg:col-span-2 min-h-0">
              <FilePreview file={selectedFile} localFiles={localFiles} />
            </div>
          </div>
        ) : (
          !loading &&
          !explorationMode && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-card flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-border border-t-primary rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Loading files...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
