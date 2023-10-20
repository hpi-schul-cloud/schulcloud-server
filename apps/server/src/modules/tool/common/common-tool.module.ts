import { forwardRef, Module } from '@nestjs/common';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { LearnroomModule } from '@modules/learnroom';
import { CommonToolService, CommonToolValidationService } from './service';
import { ToolPermissionHelper } from './uc/tool-permission-helper';

@Module({
	imports: [LoggerModule, forwardRef(() => AuthorizationModule), LegacySchoolModule, LearnroomModule],
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
