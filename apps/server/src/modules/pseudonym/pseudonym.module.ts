import { Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { PseudonymService } from './service';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { ToolConfigModule } from '../tool/tool-config.module';

@Module({
	imports: [ToolConfigModule],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
