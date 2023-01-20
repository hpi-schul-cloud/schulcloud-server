import { Module } from '@nestjs/common';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { LearnroomModule } from '@src/modules/learnroom';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenUC } from './uc';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenRepo } from './repo/share-token.repo';
import { LessonModule } from '../lesson';

@Module({
	imports: [AuthorizationModule, LearnroomModule, LessonModule, LoggerModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo, CourseRepo, LessonRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}

@Module({
	imports: [SharingModule, AuthorizationModule, LearnroomModule, LessonModule, LoggerModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC, CourseRepo, LessonRepo],
})
export class SharingApiModule {}
