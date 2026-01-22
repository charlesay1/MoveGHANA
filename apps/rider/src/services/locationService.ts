import type { Landmark } from '@movegh/types';
import { request } from './apiClient';

export const fetchLandmarks = () => request<Landmark[]>('/landmarks');

export const searchLandmarks = async (query: string) => {
  const all = await fetchLandmarks();
  const term = query.trim().toLowerCase();
  if (!term) return all.slice(0, 10);
  return all.filter((lm) => lm.name.toLowerCase().includes(term)).slice(0, 10);
};
