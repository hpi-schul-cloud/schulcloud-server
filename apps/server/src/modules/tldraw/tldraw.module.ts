import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { TldrawGateway } from './gateway';
import { config } from './config';

const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];

@Module({
	imports,
	providers: [Logger, TldrawGateway],
})
export class TldrawModule {}
