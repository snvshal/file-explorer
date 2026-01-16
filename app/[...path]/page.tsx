"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseGitHubUrl } from "@/lib/parse-github-url";
import { useGitHubStore } from "@/lib/github-store";

export default function FilePage({ params }: PageProps<"/[...path]">) {
  const slug = use(params);
  const router = useRouter();
  const setData = useGitHubStore((s) => s.setData);

  useEffect(() => {
    if (!slug?.path?.length) return;

    const pathStr = slug.path.join("/");
    const parsed = parseGitHubUrl(pathStr);

    if (!parsed.isValid) {
      setData({ urlError: parsed.error || "Invalid GitHub URL" });
      router.replace("/");
      return;
    }

    setData({
      initialUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      initialFilePath: parsed.filePath,
      urlError: "",
    });
    router.replace("/");
  }, [params, setData, router, slug.path]);

  return null;
}
