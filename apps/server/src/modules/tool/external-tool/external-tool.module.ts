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
	ExternalToolConfigurationService,
	ExternalToolLogoService,
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
	ExternalToolVersionIncrementService,
} from './service';

@Module({
	imports: [CommonToolModule, ToolConfigModule, LoggerModule, OauthProviderServiceModule, EncryptionModule, HttpModule],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolVersionIncrementService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolRepo,
		ExternalToolMetadataMapper,
		ToolContextMapper,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolVersionIncrementService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
	],
})
export class ExternalToolModule {}
