import type React from "react"
import {
  Folder,
  FileText,
  Code2,
  Database,
  Package,
  Settings,
  Lock,
  ImageIcon,
  ImageDown as Markdown,
} from "lucide-react"

export function getFileIcon(filename: string, isFolder: boolean) {
  if (isFolder) return <Folder className="w-4 h-4" />

  const extension = filename.split(".").pop()?.toLowerCase() || ""

  const icons: Record<string, React.ReactNode> = {
    // Documents
    md: <Markdown className="w-4 h-4" />,
    txt: <FileText className="w-4 h-4" />,
    pdf: <FileText className="w-4 h-4" />,

    // Code
    ts: <Code2 className="w-4 h-4" />,
    tsx: <Code2 className="w-4 h-4" />,
    js: <Code2 className="w-4 h-4" />,
    jsx: <Code2 className="w-4 h-4" />,
    py: <Code2 className="w-4 h-4" />,
    java: <Code2 className="w-4 h-4" />,
    go: <Code2 className="w-4 h-4" />,
    rs: <Code2 className="w-4 h-4" />,
    cpp: <Code2 className="w-4 h-4" />,
    c: <Code2 className="w-4 h-4" />,
    cs: <Code2 className="w-4 h-4" />,
    html: <Code2 className="w-4 h-4" />,
    css: <Code2 className="w-4 h-4" />,
    scss: <Code2 className="w-4 h-4" />,

    // Data
    json: <Database className="w-4 h-4" />,
    xml: <Database className="w-4 h-4" />,
    yaml: <Database className="w-4 h-4" />,
    yml: <Database className="w-4 h-4" />,
    sql: <Database className="w-4 h-4" />,

    // Config
    env: <Settings className="w-4 h-4" />,
    lock: <Lock className="w-4 h-4" />,
    config: <Settings className="w-4 h-4" />,
    dockerfile: <Package className="w-4 h-4" />,

    // Images
    png: <ImageIcon className="w-4 h-4" />,
    jpg: <ImageIcon className="w-4 h-4" />,
    jpeg: <ImageIcon className="w-4 h-4" />,
    gif: <ImageIcon className="w-4 h-4" />,
    svg: <ImageIcon className="w-4 h-4" />,
  }

  return icons[extension] || <FileText className="w-4 h-4" />
}

// Helper functions for file size formatting and media detection
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function isImageFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext)
}

export function isVideoFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  return ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv"].includes(ext)
}
