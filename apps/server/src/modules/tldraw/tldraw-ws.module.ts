import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { TldrawGateway } from '@src/modules/tldraw/gateway';
import { config } from './config';

@Module({
	imports: [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [Logger, TldrawGateway],
})
export class TldrawWsModule {}
