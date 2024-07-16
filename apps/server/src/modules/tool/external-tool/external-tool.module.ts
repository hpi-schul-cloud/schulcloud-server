import { EncryptionModule } from '@infra/encryption';
import { OauthProviderServiceModule } from '@infra/oauth-provider';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CommonToolModule } from '../common';
import { ToolContextMapper } from '../common/mapper/tool-context.mapper';
import { ExternalToolMetadataMapper } from './mapper';
import {
	DatasheetPdfService,
	ExternalToolAuthorizableService,
	ExternalToolConfigurationService,
	ExternalToolLogoService,
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
} from './service';

@Module({
	imports: [CommonToolModule, LoggerModule, OauthProviderServiceModule, EncryptionModule, HttpModule],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolRepo,
		ExternalToolMetadataMapper,
		ToolContextMapper,
		DatasheetPdfService,
		ExternalToolAuthorizableService,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		DatasheetPdfService,
		ExternalToolAuthorizableService,
	],
})
export class ExternalToolModule {}
