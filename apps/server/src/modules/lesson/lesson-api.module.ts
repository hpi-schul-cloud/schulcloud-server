import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization';
import { LessonController } from './controller';
import { LessonModule } from './lesson.module';
import { LessonUC } from './uc';
import { LearnroomModule } from '../learnroom';

@Module({
	imports: [LessonModule, AuthorizationModule, LearnroomModule],
	controllers: [LessonController],
	providers: [LessonUC],
})
export class LessonApiModule {}
