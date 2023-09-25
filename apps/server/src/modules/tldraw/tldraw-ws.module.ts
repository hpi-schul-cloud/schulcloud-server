import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { TldrawWsController } from '@src/modules/tldraw/controller';
import { TldrawWsService } from '@src/modules/tldraw/service/tldraw-ws.service';
import { HttpModule } from '@nestjs/axios';
import { config } from './config';

@Module({
	imports: [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config)), HttpModule],
	providers: [Logger, TldrawWsService, TldrawWsController],
})
export class TldrawWsModule {}
