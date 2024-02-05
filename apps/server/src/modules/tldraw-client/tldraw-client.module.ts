import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { HttpModule } from '@nestjs/axios';
import { getTldrawClientConfig } from './tldraw-client.config';
import { DrawingElementAdapterService } from './service/drawing-element-adapter.service';

@Module({
	imports: [LoggerModule, ConfigModule.forRoot(createConfigModuleOptions(getTldrawClientConfig)), HttpModule],
	providers: [DrawingElementAdapterService],
	exports: [DrawingElementAdapterService],
})
export class TldrawClientModule {}
