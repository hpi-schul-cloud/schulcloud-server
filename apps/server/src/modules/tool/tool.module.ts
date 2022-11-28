import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { Lti11Service } from './service/lti11.service';
import { ExternalToolService } from './service/external-tool.service';

@Module({
	imports: [LoggerModule],
	providers: [Lti11Service, LtiToolRepo, PseudonymsRepo, ExternalToolRepoMapper, ExternalToolRepo, ExternalToolService],
	exports: [Lti11Service, ExternalToolService],
})
export class ToolModule {}
