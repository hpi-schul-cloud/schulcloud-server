import { Module } from '@nestjs/common';
import { CourseRepo, ShareTokenRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { LearnroomModule } from '@src/modules/learnroom';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenUC } from './uc';

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
