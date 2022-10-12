import { Module } from '@nestjs/common';
import { CourseRepo, ShareTokenRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { ShareTokenController } from './controller/share-token.controller';
import { ParentInfoLoader } from './parent-info.loader';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';
import { ShareTokenUC } from './uc';

@Module({
	imports: [LoggerModule, AuthorizationModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo, ShareTokenUC, ParentInfoLoader, CourseRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
