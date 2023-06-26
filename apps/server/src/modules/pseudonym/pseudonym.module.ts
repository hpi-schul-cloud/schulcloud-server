import { Module } from '@nestjs/common';
import { PseudonymsRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { PseudonymService } from './service';

@Module({
	providers: [PseudonymService, PseudonymsRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
