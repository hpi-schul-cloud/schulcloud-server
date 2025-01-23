import { AuthorizationModule } from '@modules/authorization';
import { SchoolLicenseModule } from '@modules/school-license';
import { UserModule } from '@modules/user';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ContextExternalToolRule } from './authorisation/context-external-tool.rule';
import { LTI_DEEP_LINK_TOKEN_REPO, LtiDeepLinkTokenMikroOrmRepo } from './repo';
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
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		LoggerModule,
		UserLicenseModule,
		SchoolLicenseModule,
		UserModule,
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
		{
			provide: LTI_DEEP_LINK_TOKEN_REPO,
			useClass: LtiDeepLinkTokenMikroOrmRepo,
		},
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
