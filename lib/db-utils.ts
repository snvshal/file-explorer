import { set, get, del } from "idb-keyval";

export async function saveRootHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  try {
    await set("rootHandle", handle);
  } catch (err) {
    console.warn("Failed to save root handle:", err);
    throw err;
  }
}

export async function getRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await get<FileSystemDirectoryHandle>("rootHandle");
    return handle || null;
  } catch (err) {
    console.warn("Failed to get root handle:", err);
    return null;
  }
}

export async function clearRootHandle(): Promise<void> {
  try {
    await del("rootHandle");
  } catch (err) {
    console.warn("Failed to clear root handle:", err);
  }
}
