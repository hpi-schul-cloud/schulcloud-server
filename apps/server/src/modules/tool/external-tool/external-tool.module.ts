import { EventModule } from '@infra/event';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderServiceModule } from '@infra/oauth-provider';
import { EncryptionModule } from '@infra/encryption';
import { ExternalToolRepo } from '@shared/repo';
import { ToolConfigModule } from '../tool-config.module';
import { ExternalToolMetadataMapper } from './mapper';
import { ToolContextMapper } from '../common/mapper/tool-context.mapper';
import {
	ExternalToolConfigurationService,
	ExternalToolLogoService,
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
	ExternalToolVersionIncrementService,
	ExternalToolMetadataService,
} from './service';
import { CommonToolModule } from '../common';

@Module({
	imports: [
		CommonToolModule,
		ToolConfigModule,
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule,
		HttpModule,
		EventModule,
	],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolVersionIncrementService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolRepo,
		ExternalToolMetadataService,
		ExternalToolMetadataMapper,
		ToolContextMapper,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolVersionIncrementService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolMetadataService,
	],
})
export class ExternalToolModule {}
