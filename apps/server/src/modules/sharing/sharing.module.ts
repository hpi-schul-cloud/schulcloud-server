import { LoggerModule } from '@core/logger';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { LessonModule } from '@modules/lesson';
import { RoomModule } from '@modules/room';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { ShareTokenRepo } from './repo/share-token.repo';
import { ShareTokenService, TokenGenerator } from './service';

@Module({
	imports: [LoggerModule, CourseModule, LessonModule, TaskModule, BoardModule, RoomModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
