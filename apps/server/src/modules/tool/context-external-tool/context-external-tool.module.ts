import { UserLicenseModule } from '@modules/user-license';
import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ContextExternalToolAuthorizableService, ContextExternalToolService, ToolReferenceService } from './service';
import { ContextExternalToolValidationService } from './service/context-external-tool-validation.service';
import { ToolConfigurationStatusService } from './service/tool-configuration-status.service';

@Module({
	imports: [
		forwardRef(() => CommonToolModule),
		forwardRef(() => ExternalToolModule),
		SchoolExternalToolModule,
		LoggerModule,
		UserLicenseModule,
	],
	providers: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
		ToolConfigurationStatusService,
	],
	exports: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
		ToolConfigurationStatusService,
	],
})
export class ContextExternalToolModule {}
