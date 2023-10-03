import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { TldrawBoardRepo } from '@src/modules/tldraw/repo';
import { TldrawWsService } from '@src/modules/tldraw/service';
import { TldrawWs } from './controller';
import { config } from './config';

const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];

@Module({
	imports,
	providers: [Logger, TldrawWs, TldrawWsService, TldrawBoardRepo],
})
export class TldrawModule {}
