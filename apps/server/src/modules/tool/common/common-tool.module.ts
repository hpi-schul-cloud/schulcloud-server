import { forwardRef, Module } from '@nestjs/common';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolModule } from '@src/modules/school-migration';
import { CommonToolService, CommonToolValidationService } from './service';
import { ToolPermissionHelper } from './uc/tool-permission-helper';

@Module({
	imports: [LoggerModule, forwardRef(() => AuthorizationModule), SchoolModule],
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
