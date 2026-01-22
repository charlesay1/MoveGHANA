import { Controller, Get, Query } from '@nestjs/common';
import type { LandmarkCategory } from '@movegh/types';
import { GeoService } from './geo.service';

@Controller()
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('regions')
  regions() {
    return this.geo.getRegions();
  }

  @Get('cities')
  cities() {
    return this.geo.getCities();
  }

  @Get('landmarks')
  landmarks(
    @Query('q') query?: string,
    @Query('category') category?: LandmarkCategory,
    @Query('regionId') regionId?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.geo.getLandmarks({
      query,
      category,
      regionId,
      limit: parsedLimit && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
    });
  }
}
