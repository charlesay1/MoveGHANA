import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { LandmarkSearchService } from './landmark-search.service';

@Module({
  controllers: [GeoController],
  providers: [GeoService, LandmarkSearchService],
})
export class GeoModule {}
