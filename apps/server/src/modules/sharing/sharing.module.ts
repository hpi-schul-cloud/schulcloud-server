import { Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { LearnroomModule } from '@src/modules/learnroom';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenUC } from './uc';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenRepo } from './repo/share-token.repo';

@Module({
	imports: [AuthorizationModule, LearnroomModule, LoggerModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo, CourseRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}

@Module({
	imports: [SharingModule, AuthorizationModule, LearnroomModule, LoggerModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
