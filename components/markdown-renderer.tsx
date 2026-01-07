"use client"

import { useMemo } from "react"
import { marked } from "marked"

interface MarkdownRendererProps {
  content: string
  baseUrl?: string
}

export function MarkdownRenderer({ content, baseUrl }: MarkdownRendererProps) {
  const html = useMemo(() => {
    const renderer = {
      heading({ text, depth }: { text: string; depth: number }) {
        const sizes = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-base"]
        return `<h${depth} class="${sizes[depth - 1]} font-bold mt-8 mb-4 text-foreground">${text}</h${depth}>`
      },
      paragraph({ text }: { text: string }) {
        return `<p class="my-4 leading-relaxed text-foreground">${text}</p>`
      },
      image({ href, text }: { href: string; text: string }) {
        const imageSrc = href.startsWith("http") ? href : `${baseUrl}${href}`
        return `<figure class="my-6"><img src="${imageSrc}" alt="${text}" class="max-w-full h-auto rounded-lg border border-border/50" loading="lazy" /><figcaption class="text-xs text-muted-foreground mt-2 text-center">${text}</figcaption></figure>`
      },
      blockquote({ text }: { text: string }) {
        return `<blockquote class="border-l-4 border-primary pl-4 py-2 my-4 text-foreground/80 italic bg-accent/5 rounded-r">${text}</blockquote>`
      },
      code({ text, lang }: { text: string; lang?: string }) {
        const language = lang ? ` language-${lang}` : ""
        return `<pre class="bg-background/50 border border-border/50 rounded-lg p-3 my-4 overflow-x-auto"><code class="font-mono text-xs text-foreground${language}">${escapeHtml(text)}</code></pre>`
      },
      codespan({ text }: { text: string }) {
        return `<code class="bg-background px-2 py-1 rounded text-sm font-mono border border-border/50 text-primary">${escapeHtml(text)}</code>`
      },
      link({ href, text }: { href: string; text: string }) {
        return `<a href="${href}" class="text-primary hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer">${text}</a>`
      },
      list({ items, ordered }: { items: Array<{ text: string }>; ordered: boolean }) {
        const listTag = ordered ? "ol" : "ul"
        const listClass = ordered ? "list-decimal" : "list-disc"
        const itemsHtml = items.map((item) => `<li class="ml-6 my-1">${item.text}</li>`).join("")
        return `<${listTag} class="${listClass} my-3 space-y-1">${itemsHtml}</${listTag}>`
      },
      listitem({ text }: { text: string }) {
        return text
      },
      hr() {
        return '<hr class="my-6 border-border/50" />'
      },
      strong({ text }: { text: string }) {
        return `<strong class="font-bold text-foreground">${text}</strong>`
      },
      em({ text }: { text: string }) {
        return `<em class="italic text-foreground">${text}</em>`
      },
    }

    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
    }

    marked.use({ renderer })
    return marked(content)
  }, [content, baseUrl])

  return (
    <div className="text-foreground leading-relaxed max-w-none">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
