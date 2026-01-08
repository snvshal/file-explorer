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
    const cleanInput = url.trim();

    // Strict validation: username/repo
    // Allow alphanumerics, hyphens, periods, underscores
    const repoRegex = /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+$/;

    if (cleanInput && repoRegex.test(cleanInput)) {
      // Convert to full URL for the parent component's handler
      const fullUrl = `https://github.com/${cleanInput}`;
      onSearch(fullUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
      <div className="bg-background focus-within:ring-primary/30 flex w-full max-w-md items-center overflow-hidden rounded-lg border focus-within:ring-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground ml-3 h-4 w-4"
        >
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
        <Input
          type="text"
          placeholder="username/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="h-10 rounded-none border-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={
          loading ||
          !url.trim() ||
          !/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+$/.test(url.trim())
        }
        className="from-primary to-secondary text-primary-foreground bg-gradient-to-r px-4 text-xs font-medium whitespace-nowrap transition-all duration-200 hover:opacity-90 sm:px-6 sm:text-sm"
      >
        {loading ? "Loading..." : "Explore"}
      </Button>
    </form>
  );
}
