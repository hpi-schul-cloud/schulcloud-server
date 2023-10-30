import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LearnroomModule } from '../learnroom/learnroom.module';
import { LessonModule } from '../lesson/lesson.module';
import { TaskModule } from '../task/task.module';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenRepo } from './repo/share-token.repo';
import { ShareTokenService } from './service/share-token.service';
import { TokenGenerator } from './service/token-generator.service';
import { ShareTokenUC } from './uc/share-token.uc';

@Module({
	imports: [AuthorizationModule, LoggerModule, LearnroomModule, LessonModule, TaskModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}

@Module({
	imports: [SharingModule, AuthorizationModule, LearnroomModule, LessonModule, TaskModule, LoggerModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
