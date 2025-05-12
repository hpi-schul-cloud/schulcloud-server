import { ToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { MediaBoardNodeFactory } from './domain';
import { BoardNodeRepo } from './repo';
import { MediaBoardService, MediaAvailableLineService } from './service';
import { UserModule } from '@modules/user';

@Module({
	imports: [ToolModule, UserModule],
	providers: [BoardNodeRepo, MediaBoardNodeFactory, MediaBoardService, MediaAvailableLineService],
	exports: [MediaBoardNodeFactory, MediaBoardService, MediaAvailableLineService],
})
export class MediaBoardModule {}
