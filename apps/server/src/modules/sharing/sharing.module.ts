import { Module } from '@nestjs/common';
import { ShareableRepo } from '@shared/repo/shareable';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';

@Module({
	imports: [],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareableRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}
