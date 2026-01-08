export {};

declare global {
  // ---------- Base handle ----------
  interface FileSystemHandle {
    readonly kind: "file" | "directory";
    readonly name: string;

    queryPermission(
      descriptor?: FileSystemPermissionDescriptor,
    ): Promise<PermissionState>;

    requestPermission(
      descriptor?: FileSystemPermissionDescriptor,
    ): Promise<PermissionState>;
  }

  // ---------- File handle ----------
  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: "file";

    getFile(): Promise<File>;
    createWritable(
      options?: FileSystemCreateWritableOptions,
    ): Promise<FileSystemWritableFileStream>;
  }

  // ---------- Directory handle ----------
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: "directory";

    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    keys(): AsyncIterableIterator<string>;

    getDirectoryHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemDirectoryHandle>;

    getFileHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemFileHandle>;
  }

  // ---------- Window ----------
  interface Window {
    showDirectoryPicker(options?: {
      id?: string;
      mode?: "read" | "readwrite";
      startIn?:
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos";
    }): Promise<FileSystemDirectoryHandle>;
  }
}
