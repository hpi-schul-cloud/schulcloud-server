import { Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { PseudonymService } from './service';

@Module({
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
