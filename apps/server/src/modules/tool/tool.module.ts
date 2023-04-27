import { Module } from '@nestjs/common';
import {
	PseudonymsRepo,
	ExternalToolRepoMapper,
	ExternalToolRepo,
	SchoolExternalToolRepo,
	ContextExternalToolRepo,
	ExternalToolSortingMapper,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import {
	CommonToolValidationService,
	ContextExternalToolService,
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolVersionService,
	Lti11Service,
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
} from './service';
import { ExternalToolServiceMapper } from './service/mapper';

@Module({
	imports: [LoggerModule, OauthProviderServiceModule, EncryptionModule],
	providers: [
		Lti11Service,
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
	],
	exports: [
		Lti11Service,
		ExternalToolService,
		ExternalToolValidationService,
		SchoolExternalToolService,
		ContextExternalToolService,
		ExternalToolRepoMapper,
		CommonToolValidationService,
		SchoolExternalToolValidationService,
	],
})
export class ToolModule {}
