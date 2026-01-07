"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { GitHubFile } from "@/lib/types"
import { getFileIcon } from "@/lib/file-utils"

interface FileTreeProps {
  files: GitHubFile[]
  selectedFile: GitHubFile | null
  onSelectFile: (file: GitHubFile) => void
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const getChildren = (path: string): GitHubFile[] => {
    const parentPath = path.endsWith("/") ? path : path + "/"
    return files.filter(
      (file) => file.path.startsWith(parentPath) && file.path.slice(parentPath.length).split("/").length === 1,
    )
  }

  const rootItems = files.filter((file) => !file.path.includes("/"))
  const depth = new Map<string, number>()

  const calculateDepth = (path: string): number => {
    if (depth.has(path)) return depth.get(path)!
    const d = (path.match(/\//g) || []).length
    depth.set(path, d)
    return d
  }

  const sortItems = (items: GitHubFile[]): GitHubFile[] => {
    return items.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1
      }
      // Then sort by name (case sensitive lexicographical order)
      return a.name.localeCompare(b.name, undefined, { sensitivity: "variant" })
    })
  }

  const renderItems = (items: GitHubFile[], level = 0) => {
    const sortedItems = sortItems(items)

    return sortedItems.map((file) => {
      const isFolder = file.type === "dir"
      const isExpanded = expanded.has(file.path)
      const children = isFolder ? getChildren(file.path) : []
      const icon = getFileIcon(file.name, isFolder)

      return (
        <div key={file.path}>
          <div
            onClick={() => {
              if (isFolder) {
                toggleFolder(file.path)
              } else {
                onSelectFile(file)
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs sm:text-sm transition-colors group ${
              selectedFile?.path === file.path
                ? "bg-primary/20 text-primary"
                : "hover:bg-accent/10 text-foreground/70 hover:text-foreground"
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {isFolder && (
              <span className="text-muted-foreground flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
            {!isFolder && <span className="flex-shrink-0 w-4" />}
            <span className="flex-shrink-0 text-foreground/60 group-hover:text-foreground/80 w-4 h-4 flex items-center justify-center">
              {icon}
            </span>
            <span className="truncate flex-1 min-w-0">{file.name}</span>
            {isFolder && children.length > 0 && (
              <span className="ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary ring-1 ring-primary/30">
                {children.length}
              </span>
            )}
          </div>
          {isFolder && isExpanded && children.length > 0 && renderItems(children, level + 1)}
        </div>
      )
    })
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs sm:text-sm font-semibold text-foreground">Files</h2>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary ring-1 ring-secondary/30">
          {files.length}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="py-2 pr-4">
          {rootItems.length > 0 ? (
            renderItems(rootItems)
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground text-xs sm:text-sm">No files found</div>
          )}
        </div>
      </div>
    </div>
  )
}
