import { Injectable } from '@nestjs/common';
import type { LandmarkCategory } from '@movegh/types';
import { LandmarkSearchService } from './landmark-search.service';

@Injectable()
export class GeoService {
  constructor(private readonly search: LandmarkSearchService) {}

  getRegions() {
    return this.search.getRegions();
  }

  getCities() {
    return [
      { id: 'accra', name: 'Accra', regionId: 'greater_accra' },
      { id: 'kumasi', name: 'Kumasi', regionId: 'ashanti' },
    ];
  }

  getLandmarks(params?: { query?: string; category?: LandmarkCategory; regionId?: string; limit?: number }) {
    if (!params || (!params.query && !params.category && !params.regionId)) {
      return this.search.getLandmarks();
    }
    return this.search.search({
      query: params.query,
      category: params.category,
      regionId: params.regionId,
      limit: params.limit,
    });
  }
}
