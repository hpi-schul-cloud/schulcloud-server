import { Module } from '@nestjs/common';
import { ShareTokenRepo } from '@shared/repo/sharetoken';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';

@Module({
	imports: [],
	controllers: [ShareTokenController],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
