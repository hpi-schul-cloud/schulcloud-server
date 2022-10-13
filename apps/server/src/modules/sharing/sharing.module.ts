import { Module } from '@nestjs/common';
import { CourseRepo, ShareTokenRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { LearnroomModule } from '@src/modules/learnroom';
import { ShareTokenController } from './controller/share-token.controller';
import { ParentInfoLoader, ShareTokenService, TokenGenerator } from './service';
import { ShareTokenUC } from './uc';

@Module({
	imports: [LoggerModule, AuthorizationModule, LearnroomModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo, ShareTokenUC, ParentInfoLoader, CourseRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
