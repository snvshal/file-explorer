export interface GitHubFile {
  name: string
  path: string
  type: "file" | "dir"
  size: number
  url: string
}

export interface GitHubTree {
  tree: Array<{
    path: string
    mode: string
    type: "blob" | "tree"
    sha: string
    url: string
    size?: number
  }>
}
