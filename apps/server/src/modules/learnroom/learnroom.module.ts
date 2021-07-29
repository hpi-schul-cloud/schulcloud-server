import { Module } from '@nestjs/common';
import { CourseUC } from './uc';
import { CourseRepo } from './repo';
import { LearnroomFacade } from './learnroom.facade';

@Module({
	controllers: [],
	providers: [LearnroomFacade, CourseUC, CourseRepo],
	exports: [LearnroomFacade],
})
export class LearnroomModule {}
