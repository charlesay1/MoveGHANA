import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GeoModule } from './geo/geo.module';
import { TripGateway } from './ws/trip.gateway';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { RidesModule } from './rides/rides.module';
import { FareModule } from './fare/fare.module';
import { DbModule } from './db/db.module';
import { PaymentsModule } from './payments/payments.module';
import { OpsModule } from './ops/ops.module';
import { FinosModule } from './modules/finos/finos.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    DbModule,
    AuthModule,
    UsersModule,
    GeoModule,
    RidesModule,
    FareModule,
    PaymentsModule,
    OpsModule,
    FinosModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    TripGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
