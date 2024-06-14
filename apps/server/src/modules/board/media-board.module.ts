import { ToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { MediaBoardNodeFactory } from './domain';
import { BoardNodeRepo } from './repo';
import { MediaBoardService, MediaAvailableLineService } from './service';

@Module({
	imports: [ToolModule],
	providers: [BoardNodeRepo, MediaBoardNodeFactory, MediaBoardService, MediaAvailableLineService],
	exports: [MediaBoardNodeFactory, MediaBoardService, MediaAvailableLineService],
})
export class MediaBoardModule {}
