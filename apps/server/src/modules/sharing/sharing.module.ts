import { Module } from '@nestjs/common';
import { ShareTokenRepo } from '@shared/repo/sharetoken';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';
import { ShareTokenUC } from './uc';

@Module({
	imports: [LoggerModule, AuthorizationModule],
	controllers: [ShareTokenController],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo, ShareTokenUC],
	exports: [ShareTokenService],
})
export class SharingModule {}
