import { AuthorizationModule } from '@modules/authorization';
import { UserLicenseModule } from '@modules/user-license';
import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ContextExternalToolRule } from './authorisation/context-external-tool.rule';
import {
	ContextExternalToolAuthorizableService,
	ContextExternalToolService,
	LtiDeepLinkingService,
	LtiDeepLinkTokenService,
	ToolConfigurationStatusService,
	ToolReferenceService,
} from './service';
import { ContextExternalToolValidationService } from './service/context-external-tool-validation.service';

@Module({
	imports: [
		forwardRef(() => CommonToolModule),
		forwardRef(() => ExternalToolModule),
		SchoolExternalToolModule,
		LoggerModule,
		UserLicenseModule,
		AuthorizationModule,
	],
	providers: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
		ToolConfigurationStatusService,
		ContextExternalToolRule,
		LtiDeepLinkTokenService,
		LtiDeepLinkingService,
	],
	exports: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ToolReferenceService,
		ToolConfigurationStatusService,
		LtiDeepLinkTokenService,
		LtiDeepLinkingService,
	],
})
export class ContextExternalToolModule {}
