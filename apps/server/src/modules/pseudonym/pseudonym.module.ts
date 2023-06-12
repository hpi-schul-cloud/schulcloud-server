import { forwardRef, Module } from '@nestjs/common';
import { PseudonymsRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { LtiToolModule } from '@src/modules/lti-tool';
import { ToolModule } from '@src/modules/tool';
import { PseudonymService } from './service';

@Module({
	imports: [forwardRef(() => ToolModule), LtiToolModule],
	providers: [PseudonymService, PseudonymsRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
