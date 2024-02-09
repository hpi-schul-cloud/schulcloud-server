import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@src/core/logger';
import { DrawingElementAdapterService } from './service/drawing-element-adapter.service';
import { getTldrawClientConfig } from './tldraw-client.config';

@Module({
	imports: [LoggerModule, ConfigModule.forFeature(getTldrawClientConfig), HttpModule],
	providers: [DrawingElementAdapterService],
	exports: [DrawingElementAdapterService],
})
export class TldrawClientModule {}
