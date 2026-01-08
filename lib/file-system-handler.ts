import type { GitHubFile } from "./types";
import { set, get, del } from "idb-keyval";

interface StoredDirectoryHandle {
  handle: FileSystemDirectoryHandle;
  name: string;
}

let storedDirHandle: StoredDirectoryHandle | null = null;
const fileHandleCache = new Map<string, FileSystemFileHandle>();
const dirHandleCache = new Map<string, FileSystemDirectoryHandle>();

async function verifyReadPermission(
  handle: FileSystemHandle,
): Promise<boolean> {
  const options = { mode: "read" as const };

  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }

  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
}

export async function requestDirectoryAccess(): Promise<{
  files: GitHubFile[];
  fileMap: Map<string, FileSystemFileHandle>;
  dirName: string;
}> {
  try {
    if (!("showDirectoryPicker" in window)) {
      throw new Error(
        "File System Access API not supported. Please use Chrome, Edge, or Opera browser.",
      );
    }

    const dirHandle = await window.showDirectoryPicker();

    if (!(await verifyReadPermission(dirHandle))) {
      throw new Error(
        "Read permission denied. Please grant access to the directory.",
      );
    }

    storedDirHandle = {
      handle: dirHandle,
      name: dirHandle.name,
    };

    fileHandleCache.clear();
    dirHandleCache.clear();

    // Cache root
    dirHandleCache.set("", dirHandle);

    await set("rootHandle", storedDirHandle);

    const { files, fileMap } = await readDirectoryHandle(dirHandle, "");
    return { files, fileMap, dirName: dirHandle.name };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Directory selection cancelled");
    }
    throw err;
  }
}

export async function restoreDirectoryAccess(): Promise<{
  files: GitHubFile[];
  fileMap: Map<string, FileSystemFileHandle>;
  dirName: string;
} | null> {
  try {
    const stored = await get<StoredDirectoryHandle>("rootHandle");
    if (!stored) return null;

    const dirHandle = stored.handle;

    if (!(await verifyReadPermission(dirHandle))) {
      await del("rootHandle");
      storedDirHandle = null;
      return null;
    }

    storedDirHandle = stored;

    fileHandleCache.clear();
    dirHandleCache.clear();
    dirHandleCache.set("", dirHandle);

    // Only read root level
    const { files, fileMap } = await readDirectoryHandle(dirHandle, "");

    return { files, fileMap, dirName: stored.name };
  } catch (err) {
    console.error("Failed to restore directory access:", err);
    await del("rootHandle");
    storedDirHandle = null;
    return null;
  }
}

export function saveDirectoryHandleReference(name: string): void {
  if (storedDirHandle) {
    set("rootHandle", storedDirHandle).catch((err) => {
      console.warn("Failed to save handle:", err);
    });
  }
}

// Read specific directory from cache by path
export async function readDirectory(path: string): Promise<{
  files: GitHubFile[];
  fileMap: Map<string, FileSystemFileHandle>;
}> {
  const handle = dirHandleCache.get(path);
  if (!handle) {
    throw new Error(`Directory handle not found for path: ${path}`);
  }
  return readDirectoryHandle(handle, path);
}

// Shallow read of a directory handle
async function readDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  basePath = "",
): Promise<{
  files: GitHubFile[];
  fileMap: Map<string, FileSystemFileHandle>;
}> {
  const files: GitHubFile[] = [];
  const fileMap = new Map<string, FileSystemFileHandle>();
  const entries: Array<[string, FileSystemHandle]> = [];

  try {
    for await (const [name, entryHandle] of handle.entries()) {
      entries.push([name, entryHandle]);
    }
  } catch (err) {
    console.warn(`Failed to read directory ${basePath}:`, err);
    return { files: [], fileMap: new Map() };
  }

  // Sort: Directories first, then files alphabetically
  entries.sort((a, b) => {
    const aIsDir = a[1].kind === "directory";
    const bIsDir = b[1].kind === "directory";
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a[0].localeCompare(b[0], undefined, { sensitivity: "variant" });
  });

  for (const [name, entryHandle] of entries) {
    const path = basePath ? `${basePath}/${name}` : name;

    if (entryHandle.kind === "file") {
      files.push({
        name,
        path,
        type: "file",
        size: 0, // Placeholder
        url: "",
      });

      fileHandleCache.set(path, entryHandle as FileSystemFileHandle);
      fileMap.set(path, entryHandle as FileSystemFileHandle);
    } else if (entryHandle.kind === "directory") {
      files.push({
        name,
        path,
        type: "dir",
        size: 0,
        url: "",
      });

      // Cache the handle so we can read it later
      dirHandleCache.set(path, entryHandle as FileSystemDirectoryHandle);
    }
  }

  return { files, fileMap };
}

export function getCachedFileHandle(
  path: string,
): FileSystemFileHandle | undefined {
  return fileHandleCache.get(path);
}
