import { forwardRef, Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import {
	ContextExternalToolRepo,
	ExternalToolRepo,
	ExternalToolRepoMapper,
	ExternalToolSortingMapper,
	SchoolExternalToolRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { PseudonymModule } from '@src/modules/pseudonym';
import { UserModule } from '@src/modules/user';
import { Lti11EncryptionService, ToolLaunchService } from './launch-tool/service';
import {
	BasicToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
} from './launch-tool/service/strategy';
import {
	CommonToolService,
	CommonToolValidationService,
	ContextExternalToolService,
	ContextExternalToolValidationService,
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolVersionService,
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
	ExternalToolServiceMapper,
} from './service';
import ToolConfiguration, { ToolFeatures } from './tool-config';

@Module({
	imports: [
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule,
		forwardRef(() => AuthorizationModule),
		UserModule,
		forwardRef(() => PseudonymModule),
	],
	providers: [
		{
			provide: ToolFeatures,
			useValue: ToolConfiguration.toolFeatures,
		},
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolRepo,
		ExternalToolRepoMapper,
		ExternalToolSortingMapper,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		ExternalToolValidationService,
		ExternalToolVersionService,
		SchoolExternalToolService,
		ContextExternalToolService,
		CommonToolValidationService,
		SchoolExternalToolValidationService,
		ContextExternalToolValidationService,
		ToolLaunchService,
		Lti11EncryptionService,
		BasicToolLaunchStrategy,
		Lti11ToolLaunchStrategy,
		OAuth2ToolLaunchStrategy,
		CommonToolService,
	],
	exports: [
		ToolFeatures,
		ExternalToolService,
		ExternalToolValidationService,
		SchoolExternalToolService,
		ContextExternalToolService,
		ExternalToolRepoMapper,
		CommonToolValidationService,
		SchoolExternalToolValidationService,
		ContextExternalToolValidationService,
		ToolLaunchService,
		CommonToolService,
	],
})
export class ToolModule {}
