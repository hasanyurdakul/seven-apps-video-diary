import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoEntry {
  id: string;
  videoUri: string;
  name: string;
  description: string;
}

interface VideoDiaryState {
  videos: VideoEntry[];
  addVideo: (video: VideoEntry) => void;
  updateVideo: (id: string, updatedVideo: Partial<VideoEntry>) => void;
  deleteVideo: (id: string) => void;
  clearVideos: () => void;
}

export const useVideoDiaryStore = create<VideoDiaryState>()(
  persist(
    (set, get) => ({
      videos: [],
      addVideo: video => set({ videos: [...get().videos, video] }),
      updateVideo: (id, updatedVideo) =>
        set({
          videos: get().videos.map(v => (v.id === id ? { ...v, ...updatedVideo } : v)),
        }),
      deleteVideo: id => set({ videos: get().videos.filter(v => v.id !== id) }),
      clearVideos: () => set({ videos: [] }),
    }),
    {
      name: 'video-diary-storage',
      storage: {
        getItem: async name => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async name => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
