import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GeoModule } from './geo/geo.module';
import { TripGateway } from './ws/trip.gateway';
import { HealthController } from './health.controller';

@Module({
  imports: [AuthModule, UsersModule, GeoModule],
  controllers: [HealthController],
  providers: [TripGateway],
})
export class AppModule {}
