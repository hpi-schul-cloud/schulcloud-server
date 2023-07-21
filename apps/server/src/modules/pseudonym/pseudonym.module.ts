import { forwardRef, Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { PseudonymService } from './service';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { ToolModule } from '../tool';

@Module({
	imports: [forwardRef(() => ToolModule)],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
