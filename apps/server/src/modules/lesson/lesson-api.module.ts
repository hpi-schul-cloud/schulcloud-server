import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LessonController } from './controller/lesson.controller';
import { LessonModule } from './lesson.module';
import { LessonUC } from './uc/lesson.uc';

@Module({
	imports: [LessonModule, AuthorizationModule],
	controllers: [LessonController],
	providers: [LessonUC],
})
export class LessonApiModule {}
