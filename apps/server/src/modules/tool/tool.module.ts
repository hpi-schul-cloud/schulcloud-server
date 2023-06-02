import { forwardRef, Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import {
	ContextExternalToolRepo,
	ExternalToolRepo,
	ExternalToolRepoMapper,
	ExternalToolSortingMapper,
	PseudonymsRepo,
	SchoolExternalToolRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { PseudonymModule } from '../pseudonym';
import { UserModule } from '../user';
import { Lti11EncryptionService } from './launch-tool/service/lti11-encryption.service';
import { BasicToolLaunchStrategy, Lti11ToolLaunchStrategy } from './launch-tool/service/strategy';
import { ToolLaunchService } from './launch-tool/service/tool-launch.service';
import {
	CommonToolValidationService,
	ContextExternalToolService,
	ContextExternalToolValidationService,
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolVersionService,
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
} from './service';
import { ExternalToolServiceMapper } from './service/mapper';

@Module({
	imports: [
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule,
		forwardRef(() => AuthorizationModule),
		UserModule,
		PseudonymModule,
	],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		PseudonymsRepo,
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
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		SchoolExternalToolService,
		ContextExternalToolService,
		ExternalToolRepoMapper,
		CommonToolValidationService,
		SchoolExternalToolValidationService,
		ContextExternalToolValidationService,
		ToolLaunchService,
	],
})
export class ToolModule {}
