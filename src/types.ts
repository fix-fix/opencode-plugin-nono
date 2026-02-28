export interface NonoCapabilityFile {
  fs: NonoFsEntry[];
  net_blocked: boolean;
  workdir?: {
    path: string;
    access: "none" | "read" | "write" | "readwrite";
  };
}

export interface NonoFsEntry {
  path: string;
  access: "read" | "write" | "readwrite";
}

export interface NonoCapabilities {
  loaded: boolean;
  fs: NonoFsEntry[];
  netBlocked: boolean;
  workdir?: {
    path: string;
    access: "none" | "read" | "write" | "readwrite";
  };
}
