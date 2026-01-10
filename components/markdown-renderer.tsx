"use client";

import { useMemo } from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
  baseUrl?: string;
  repoOwner?: string;
  repoName?: string;
  filePath?: string;
}

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export function MarkdownRenderer({
  content,
  baseUrl = "",
  repoOwner,
  repoName,
  filePath,
}: MarkdownRendererProps) {
  const html = useMemo(() => {
    const resolveImageUrl = (href: string): string => {
      if (href.startsWith("http")) return href;
      if (!repoOwner || !repoName) return href;

      const fileDir = filePath
        ? filePath.split("/").slice(0, -1).join("/")
        : "";
      const resolvedPath = fileDir
        ? `${fileDir}/${href}`.replace(/\/+/g, "/")
        : href;

      return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/HEAD/${resolvedPath}`;
    };

    const renderer = new marked.Renderer();

    renderer.heading = ({ text, depth }) => {
      const sizes = [
        "text-3xl",
        "text-2xl",
        "text-xl",
        "text-lg",
        "text-base",
        "text-base",
      ];
      return `<h${depth} class="${sizes[depth - 1]} font-bold mt-8 mb-4 text-foreground">${text}</h${depth}>`;
    };

    renderer.paragraph = ({ text }) => {
      return `<p class="my-4 leading-relaxed text-foreground">${marked.parseInline(text)}</p>`;
    };

    renderer.image = ({ href, text }) => {
      const imageSrc = resolveImageUrl(href);
      return `<figure class="my-6"><img src="${imageSrc}" alt="${text}" class="max-w-full h-auto rounded-lg border border-border/50" loading="lazy" /><figcaption class="text-xs text-muted-foreground mt-2 text-center">${text}</figcaption></figure>`;
    };

    renderer.blockquote = ({ tokens }) => {
      return `<blockquote class="markdown-blockquote border-l-4 border-primary pl-4 py-2 my-4 text-foreground/80 bg-accent/5 rounded-r">${marked.parser(tokens)}</blockquote>`;
    };

    renderer.code = ({ text, lang }) => {
      const language = lang ? ` language-${lang}` : "";
      return `<pre class="bg-background/50 border border-border/50 rounded-lg p-3 my-4 overflow-x-auto"><code class="font-mono text-xs text-foreground${language}">${escapeHtml(text)}</code></pre>`;
    };

    renderer.codespan = ({ text }) => {
      return `<code class="bg-background px-2 py-1 rounded text-sm font-mono border border-border/50 text-primary">${escapeHtml(text)}</code>`;
    };

    renderer.link = ({ href, text }) => {
      return `<a href="${href}" class="text-primary hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };

    renderer.list = ({ items, ordered }) => {
      const listTag = ordered ? "ol" : "ul";
      const listClass = ordered ? "list-decimal" : "list-disc";
      const itemsHtml = items
        .map((item) => {
          const itemContent = marked.parser(item.tokens, { renderer });
          return `<li class="my-1">${itemContent}</li>`;
        })
        .join("");
      return `<${listTag} class="${listClass} my-3 space-y-1 ml-6">${itemsHtml}</${listTag}>`;
    };

    renderer.listitem = ({ tokens }) => {
      return marked.parser(tokens, { renderer });
    };

    renderer.hr = () => {
      return '<hr class="my-6 border-border/50" />';
    };

    renderer.strong = ({ text }) => {
      return `<strong class="font-bold text-foreground">${text}</strong>`;
    };

    renderer.em = ({ text }) => {
      return `<em class="italic text-foreground">${text}</em>`;
    };

    marked.use({ renderer });
    return marked(content);
  }, [content, baseUrl, repoOwner, repoName, filePath]);

  return (
    <div className="text-foreground max-w-none leading-relaxed">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
