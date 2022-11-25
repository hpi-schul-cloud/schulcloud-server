import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { Lti11Service } from './service/lti11.service';
import { ExternalToolService } from './service/external-tool.service';

@Module({
	imports: [LoggerModule],
	providers: [
		Lti11Service,
		ExternalToolService,
		LtiToolRepo,
		PseudonymsRepo,
		ExternalToolRepo,
		ExternalToolRepoMapper,
		SchoolExternalToolRepo,
		CourseExternalToolRepo,
	],
	exports: [Lti11Service, ExternalToolService],
})
export class ToolModule {}
