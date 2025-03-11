import { AuthorizationModule } from '@modules/authorization';
import { CourseModule } from '@modules/course';
import { Module } from '@nestjs/common';
import { LessonController, LessonUC } from './api';
import { LessonModule } from './lesson.module';

@Module({
	imports: [LessonModule, AuthorizationModule, CourseModule],
	controllers: [LessonController],
	providers: [LessonUC],
})
export class LessonApiModule {}
