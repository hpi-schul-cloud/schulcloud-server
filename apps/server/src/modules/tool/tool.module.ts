import { Module } from '@nestjs/common';
import { PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { ExternalToolSortingMapper } from '@shared/repo/externaltool/external-tool-sorting.mapper';
import { Lti11Service } from './service/lti11.service';
import { ExternalToolService } from './service/external-tool.service';
import { ExternalToolServiceMapper } from './service/mapper';
import { ToolValidationService } from './service/validation/tool-validation.service';
import { ExternalToolVersionService } from './service/external-tool-version.service';
import { SchoolExternalToolService } from './service/school-external-tool.service';
import { CourseExternalToolService } from './service/course-external-tool.service';
import { CommonToolValidationService } from './service/validation/common-tool-validation.service';

@Module({
	imports: [LoggerModule, OauthProviderServiceModule, EncryptionModule],
	providers: [
		Lti11Service,
		ExternalToolService,
		ExternalToolServiceMapper,
		PseudonymsRepo,
		ExternalToolRepo,
		ExternalToolRepoMapper,
		ExternalToolSortingMapper,
		SchoolExternalToolRepo,
		CourseExternalToolRepo,
		ToolValidationService,
		ExternalToolVersionService,
		SchoolExternalToolService,
		CourseExternalToolService,
		CommonToolValidationService,
	],
	exports: [
		Lti11Service,
		ExternalToolService,
		ToolValidationService,
		SchoolExternalToolService,
		CourseExternalToolService,
		ExternalToolRepoMapper,
		CommonToolValidationService,
	],
})
export class ToolModule {}
