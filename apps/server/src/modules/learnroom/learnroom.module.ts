import { Module } from '@nestjs/common';
import { CourseUC } from './uc';
import { CourseRepo, CoursegroupRepo } from './repo';
import { LearnroomFacade } from './learnroom.facade';

@Module({
	controllers: [],
	providers: [LearnroomFacade, CourseUC, CourseRepo, CoursegroupRepo],
	exports: [LearnroomFacade],
})
export class LearnroomModule {}
