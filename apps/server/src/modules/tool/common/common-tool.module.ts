import { Module } from '@nestjs/common';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CommonToolService, CommonToolValidationService } from './service';
import { AuthorizationModule } from '../../authorization';
import { ToolPermissionHelper } from './uc/tool-permission-helper';

@Module({
	imports: [LoggerModule, AuthorizationModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [
		ToolPermissionHelper,
		CommonToolService,
		CommonToolValidationService,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
	],
	exports: [
		ToolPermissionHelper,
		CommonToolService,
		CommonToolValidationService,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
	],
})
export class CommonToolModule {}
