import { forwardRef, Module } from '@nestjs/common';
import { ContextExternalToolRepo } from '@shared/repo/contextexternaltool/context-external-tool.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '@src/modules/authorization/authorization.module';
import { LegacySchoolModule } from '@src/modules/legacy-school/legacy-school.module';
import { CommonToolValidationService } from './service/common-tool-validation.service';
import { CommonToolService } from './service/common-tool.service';
import { ToolPermissionHelper } from './uc/tool-permission-helper';

@Module({
	imports: [LoggerModule, forwardRef(() => AuthorizationModule), LegacySchoolModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [
		CommonToolService,
		CommonToolValidationService,
		ToolPermissionHelper,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
	],
	exports: [
		CommonToolService,
		CommonToolValidationService,
		ToolPermissionHelper,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
	],
})
export class CommonToolModule {}
