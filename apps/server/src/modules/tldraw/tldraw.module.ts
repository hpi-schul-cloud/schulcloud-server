import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { TldrawWsController } from './controller';
import { config } from './config';

const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];

@Module({
	imports,
	providers: [Logger, TldrawWsController],
})
export class TldrawModule {}
