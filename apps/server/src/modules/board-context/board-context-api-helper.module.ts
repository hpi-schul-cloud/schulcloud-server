import { Module } from '@nestjs/common';
import { RoomModule } from '../room';
import { BoardContextApiHelperService } from './board-context-api-helper.service';
import { BoardModule } from '../board/board.module';
import { LearnroomModule } from '../learnroom';

@Module({
	imports: [BoardModule, LearnroomModule, RoomModule],
	providers: [BoardContextApiHelperService],
	exports: [BoardContextApiHelperService],
})
export class BoardContextModule {}
