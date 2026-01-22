import { Injectable } from '@nestjs/common';
import type { Landmark, LandmarkCategory, Region } from '@movegh/types';
import data from '../../../locations/ghana-landmarks.json';

type SearchParams = {
  query?: string;
  category?: LandmarkCategory;
  regionId?: string;
  limit?: number;
};

@Injectable()
export class LandmarkSearchService {
  private readonly regions: Region[] = data.regions;
  private readonly landmarks: Landmark[] = data.landmarks;

  getRegions() {
    return this.regions;
  }

  getLandmarks() {
    return this.landmarks;
  }

  search({ query, category, regionId, limit = 20 }: SearchParams) {
    const q = (query || '').trim().toLowerCase();
    let results = this.landmarks;

    if (category) {
      results = results.filter((item) => item.category === category);
    }

    if (regionId) {
      results = results.filter((item) => item.regionId === regionId);
    }

    if (!q) {
      return results.slice(0, limit);
    }

    return results
      .map((item) => ({ item, score: scoreMatch(item.name, q) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.item);
  }
}

const scoreMatch = (value: string, query: string) => {
  const name = value.toLowerCase();
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (name.includes(query)) return 60;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  let score = 0;
  for (const token of tokens) {
    if (name.includes(token)) score += 20;
  }
  return score;
};
