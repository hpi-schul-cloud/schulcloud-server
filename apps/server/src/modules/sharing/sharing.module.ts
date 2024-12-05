import { BoardModule } from '@modules/board';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RoomModule } from '../room';
import { ShareTokenRepo } from './repo/share-token.repo';
import { ShareTokenService, TokenGenerator } from './service';

@Module({
	imports: [LoggerModule, LearnroomModule, LessonModule, TaskModule, BoardModule, RoomModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
