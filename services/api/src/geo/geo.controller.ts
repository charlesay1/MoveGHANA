import { Controller, Get } from '@nestjs/common';
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
  landmarks() {
    return this.geo.getLandmarks();
  }
}
