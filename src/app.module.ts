import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { createLoggerConfig } from './config/logger.config';
import { MetricsModule } from './infrastructure/monitoring/metrics.module';
import { AccountTypesModule } from './modules/account-types/account-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createLoggerConfig,
    }),

    MetricsModule,
    AccountTypesModule,
  ],
})
export class AppModule {}