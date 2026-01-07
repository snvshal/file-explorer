"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RepositoryInputProps {
  onSearch: (url: string) => void;
  loading: boolean;
}

export function RepositoryInput({ onSearch, loading }: RepositoryInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      let fullUrl = url.trim();
      if (!fullUrl.includes("github.com")) {
        fullUrl = `https://github.com/${fullUrl}`;
      } else if (!fullUrl.startsWith("http")) {
        fullUrl = `https://${fullUrl}`;
      }
      onSearch(fullUrl);
    }
  };

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
        className="from-primary to-secondary text-primary-foreground bg-gradient-to-r px-4 text-xs font-medium whitespace-nowrap transition-all duration-200 hover:opacity-90 sm:px-6 sm:text-sm"
      >
        {loading ? "Loading..." : "Explore"}
      </Button>
    </form>
  );
}
