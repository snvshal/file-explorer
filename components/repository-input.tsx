"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RepositoryInputProps {
  onSearch: (url: string) => void
  loading: boolean
}

export function RepositoryInput({ onSearch, loading }: RepositoryInputProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      let fullUrl = url.trim()
      if (!fullUrl.includes("github.com")) {
        fullUrl = `https://github.com/${fullUrl}`
      } else if (!fullUrl.startsWith("http")) {
        fullUrl = `https://${fullUrl}`
      }
      onSearch(fullUrl)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
      <Input
        type="text"
        placeholder="username/repo or full GitHub URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="bg-input border-border focus:border-primary focus:ring-primary/20 text-xs sm:text-sm"
        disabled={loading}
      />
      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-medium px-4 sm:px-6 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
      >
        {loading ? "Loading..." : "Explore"}
      </Button>
    </form>
  )
}
