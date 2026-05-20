import { create } from "zustand";

type ProgressSyncState = {
  isRoomProgressSaving: boolean;
  setRoomProgressSaving: (isRoomProgressSaving: boolean) => void;
};

export const useProgressSyncStore = create<ProgressSyncState>((set) => ({
  isRoomProgressSaving: false,
  setRoomProgressSaving: (isRoomProgressSaving) => set({ isRoomProgressSaving }),
}));
