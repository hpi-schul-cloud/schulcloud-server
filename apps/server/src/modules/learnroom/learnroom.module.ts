import { Module } from '@nestjs/common';
import { CourseUC } from './uc';
import { CourseRepo } from './repo';

@Module({
	controllers: [],
	providers: [CourseUC, CourseRepo],
	exports: [],
})
export class LearnroomModule {}
