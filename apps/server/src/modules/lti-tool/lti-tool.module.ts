import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LegacyLogger } from '@core/logger';
import { LtiToolService } from './service';

@Module({
	providers: [LtiToolService, LtiToolRepo, LegacyLogger],
	exports: [LtiToolService],
})
export class LtiToolModule {}
