import { Module } from '@nestjs/common';
import {
	ContextExternalToolRepo,
	ExternalToolRepo,
	ExternalToolRepoMapper,
	ExternalToolSortingMapper,
	PseudonymsRepo,
	SchoolExternalToolRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import {
	CommonToolValidationService,
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolVersionService,
} from './external-tool/service';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from './school-external-tool/service';
import { Lti11Service, ToolLaunchService } from './launch-tool/service';
import { ContextExternalToolService, ContextExternalToolValidationService } from './context-external-tool/service';
import { ExternalToolServiceMapper } from './external-tool/service/mapper';
import { BasicToolLaunchStrategy } from './launch-tool/strategy';

@Module({
	imports: [LoggerModule, OauthProviderServiceModule, EncryptionModule],
	providers: [
		BasicToolLaunchStrategy,
		CommonToolValidationService,
		ContextExternalToolRepo,
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ExternalToolRepo,
		ExternalToolRepoMapper,
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolSortingMapper,
		ExternalToolValidationService,
		ExternalToolVersionService,
		Lti11Service,
		PseudonymsRepo,
		SchoolExternalToolRepo,
		SchoolExternalToolService,
		SchoolExternalToolValidationService,
		ToolLaunchService,
	],
	exports: [
		CommonToolValidationService,
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ExternalToolRepoMapper,
		ExternalToolService,
		ExternalToolValidationService,
		Lti11Service,
		SchoolExternalToolService,
		SchoolExternalToolValidationService,
		ToolLaunchService,
	],
})
export class ToolModule {}
