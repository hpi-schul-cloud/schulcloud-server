import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool/ltitool.repo';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { LtiToolService } from './service/lti-tool.service';

@Module({
	providers: [LtiToolService, LtiToolRepo, LegacyLogger],
	exports: [LtiToolService],
})
export class LtiToolModule {}
