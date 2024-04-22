import { ToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { MediaAvailableLineService } from './service';

@Module({
	imports: [ToolModule],
	providers: [MediaAvailableLineService],
	exports: [MediaAvailableLineService],
})
export class MediaBoardModule {}
