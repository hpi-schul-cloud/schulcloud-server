import { Module } from '@nestjs/common';
import { CourseUC } from './uc';

@Module({
	controllers: [],
	providers: [CourseUC],
	exports: [],
})
export class LearnroomModule {}
