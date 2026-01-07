"use client"

import type React from "react"
import { useRef, useState } from "react"
import type { GitHubFile } from "@/lib/types"

interface LocalFileUploadProps {
  onFilesLoaded: (files: GitHubFile[], fileMap: Map<string, File>) => void
}

export function LocalFileUpload({ onFilesLoaded }: LocalFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFiles = async (fileList: FileList) => {
    const processedFiles: GitHubFile[] = []
    const fileMap = new Map<string, File>()
    const pathSet = new Set<string>()

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const relativePath = file.webkitRelativePath || file.name

      if (!pathSet.has(relativePath)) {
        pathSet.add(relativePath)
        processedFiles.push({
          name: file.name || relativePath.split("/").pop() || "file",
          path: relativePath,
          type: "file",
          size: file.size,
          url: "",
        })
        fileMap.set(relativePath, file)
      }
    }

    // Create directory entries from file paths
    const dirPaths = new Set<string>()
    for (const path of pathSet) {
      const parts = path.split("/")
      for (let i = 1; i < parts.length; i++) {
        const dirPath = parts.slice(0, i).join("/")
        if (!dirPaths.has(dirPath)) {
          dirPaths.add(dirPath)
          processedFiles.push({
            name: parts[i - 1],
            path: dirPath,
            type: "dir",
            size: 0,
            url: "",
          })
        }
      }
    }

    processedFiles.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1
      return a.path.localeCompare(b.path)
    })

    onFilesLoaded(processedFiles, fileMap)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-2 sm:p-3 cursor-pointer transition-colors ${
        isDragging
          ? "border-secondary bg-secondary/10"
          : "border-border hover:border-muted-foreground bg-card/50 hover:bg-card"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        webkitdirectory="true"
        onChange={handleFileInput}
        className="hidden"
        accept="*"
      />
      <div className="flex items-center justify-center gap-2">
        <svg
          className="w-4 h-4 text-muted-foreground flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-xs sm:text-sm text-foreground/70 truncate">Upload Directory</span>
      </div>
    </div>
  )
}
