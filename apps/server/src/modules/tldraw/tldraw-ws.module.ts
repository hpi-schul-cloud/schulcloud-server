import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { HttpModule } from '@nestjs/axios';
import { MetricsService } from './metrics';
import { TldrawBoardRepo } from './repo';
import { TldrawWsService } from './service';
import { TldrawWs } from './controller';
import { config } from './config';

@Module({
	imports: [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config)), HttpModule],
	providers: [Logger, TldrawWs, TldrawWsService, TldrawBoardRepo, MetricsService],
})
export class TldrawWsModule {}
