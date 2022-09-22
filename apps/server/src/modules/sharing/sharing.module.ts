import { Module } from '@nestjs/common';
import { ShareTokenRepo } from '@shared/repo/sharetoken';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';

@Module({
	imports: [],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
