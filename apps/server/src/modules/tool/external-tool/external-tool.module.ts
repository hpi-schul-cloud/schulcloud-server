import { EncryptionModule } from '@infra/encryption';
import { OauthProviderServiceModule } from '@infra/oauth-provider';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CommonToolModule } from '../common';
import { ToolContextMapper } from '../common/mapper/tool-context.mapper';
import { ToolConfigModule } from '../tool-config.module';
import { ExternalToolMetadataMapper } from './mapper';
import {
	DatasheetPdfService,
	ExternalToolConfigurationService,
	ExternalToolLogoService,
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
} from './service';

@Module({
	imports: [CommonToolModule, ToolConfigModule, LoggerModule, OauthProviderServiceModule, EncryptionModule, HttpModule],
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
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		DatasheetPdfService,
	],
})
export class ExternalToolModule {}
