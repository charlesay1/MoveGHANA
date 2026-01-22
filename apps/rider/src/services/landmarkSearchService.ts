import * as SecureStore from 'expo-secure-store';
import type { Landmark, LandmarkCategory } from '@movegh/types';
import { request } from './apiClient';

const RECENTS_KEY = 'movegh_rider_recent_locations';
const MAX_RECENTS = 8;

export type LandmarkSearchParams = {
  query?: string;
  category?: LandmarkCategory;
  regionId?: string;
  limit?: number;
};

export type RecentLocation = {
  id: string;
  name: string;
  category?: LandmarkCategory;
  regionId?: string;
  lat?: number;
  lng?: number;
};

export const searchLandmarks = async (params: LandmarkSearchParams) => {
  const pairs: string[] = [];
  if (params.query) pairs.push(`q=${encodeURIComponent(params.query)}`);
  if (params.category) pairs.push(`category=${encodeURIComponent(params.category)}`);
  if (params.regionId) pairs.push(`regionId=${encodeURIComponent(params.regionId)}`);
  if (params.limit) pairs.push(`limit=${encodeURIComponent(String(params.limit))}`);
  const suffix = pairs.length ? `?${pairs.join('&')}` : '';
  return request<Landmark[]>(`/landmarks${suffix}`);
};

export const loadRecentLocations = async (): Promise<RecentLocation[]> => {
  try {
    const raw = await SecureStore.getItemAsync(RECENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentLocation[];
  } catch {
    return [];
  }
};

export const saveRecentLocation = async (location: RecentLocation): Promise<RecentLocation[]> => {
  const existing = await loadRecentLocations();
  const next = [location, ...existing.filter((item) => item.id !== location.id)].slice(0, MAX_RECENTS);
  try {
    await SecureStore.setItemAsync(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
};

export const clearRecentLocations = async () => {
  try {
    await SecureStore.deleteItemAsync(RECENTS_KEY);
  } catch {
    // ignore
  }
};
