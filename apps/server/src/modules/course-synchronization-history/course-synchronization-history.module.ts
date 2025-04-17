import { Module } from '@nestjs/common';
import { CourseSynchronizationHistoryMirkoOrmRepo } from './repo/mikro-orm';
import { COURSE_SYNCHRONIZATION_HISTORY_REPO } from './repo';
import { CourseSynchronizationHistoryService } from './domain';

@Module({
	providers: [
		{
			provide: COURSE_SYNCHRONIZATION_HISTORY_REPO,
			useClass: CourseSynchronizationHistoryMirkoOrmRepo,
		},
		CourseSynchronizationHistoryService,
	],
	exports: [CourseSynchronizationHistoryService],
})
export class CourseSynchronizationHistoryModule {}
