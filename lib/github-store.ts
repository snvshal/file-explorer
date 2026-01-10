import { create } from "zustand";

interface GitHubState {
  initialUrl: string;
  initialFilePath: string;
  urlError: string;
  setData: (data: Partial<GitHubState>) => void;
}

export const useGitHubStore = create<GitHubState>((set) => ({
  initialUrl: "",
  initialFilePath: "",
  urlError: "",
  setData: (data) => set(data),
}));
