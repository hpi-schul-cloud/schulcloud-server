import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { LessonController } from './controller';
import { LessonModule } from './lesson.module';
import { LessonUC } from './uc';

@Module({
	imports: [LessonModule, AuthorizationModule],
	controllers: [LessonController],
	providers: [LessonUC],
})
export class LessonApiModule {}
