import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { CourseRepo } from '@shared/repo';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenUC } from './uc';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenRepo } from './repo/share-token.repo';
import { CourseService } from '../learnroom/service/course.service';
import { LessonModule } from '../lesson';
import { LearnroomModule } from '../learnroom';

@Module({
	imports: [AuthorizationModule, LoggerModule, LessonModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo, CourseService, CourseRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}

@Module({
	imports: [SharingModule, AuthorizationModule, LearnroomModule, LessonModule, LoggerModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
