import { forwardRef, Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization';
import { LessonController } from './controller';
import { LessonModule } from './lesson.module';
import { LessonUC } from './uc';

@Module({
	imports: [LessonModule, forwardRef(() => AuthorizationModule)],
	controllers: [LessonController],
	providers: [LessonUC],
})
export class LessonApiModule {}
