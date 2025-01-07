import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization';
import { RoomModule } from '../room';
import { BoardContextApiHelperService } from './board-context-api-helper.service';
import { BoardModule } from './board.module';
import { LearnroomModule } from '../learnroom';

@Module({
	imports: [AuthorizationModule, BoardModule, LearnroomModule, RoomModule],
	providers: [BoardContextApiHelperService],
	exports: [BoardContextApiHelperService],
})
export class BoardContextApiHelperModule {}
