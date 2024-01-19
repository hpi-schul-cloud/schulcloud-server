import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { DrawingElementAdapterService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [DrawingElementAdapterService],
	exports: [],
})
export class TldrawClientModule {}
