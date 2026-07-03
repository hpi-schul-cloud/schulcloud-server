import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import {
	FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN,
	FilesStorageRestClientConfig,
	FilesStorageRestClientModule,
} from '@infra/files-storage-rest-client';
import { LoggerModule } from '@infra/logger';
import { AuthorizationModule } from '@modules/authorization';
import { OauthProviderServiceModule } from '@modules/oauth-provider';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { InstanceModule } from '../../instance';
import { CommonToolModule } from '../common';
import { ToolContextMapper } from '../common/mapper/tool-context.mapper';
import { TOOL_ENCRYPTION_CONFIG_TOKEN, ToolEncryptionConfig } from '../encryption.config';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../tool-config';
import { ExternalToolRule } from './authorization/external-tool.rule';
import { ExternalToolUtilizationMapper } from './mapper';
import {
	DatasheetPdfService,
	ExternalToolAuthorizableService,
	ExternalToolConfigurationService,
	ExternalToolImageService,
	ExternalToolLogoSanitizerService,
	ExternalToolLogoService,
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
} from './service';

@Module({
	imports: [
		CommonToolModule,
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule.register(TOOL_ENCRYPTION_CONFIG_TOKEN, ToolEncryptionConfig),
		HttpModule,
		InstanceModule,
		AuthorizationModule,
		FilesStorageRestClientModule.register(FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN, FilesStorageRestClientConfig),
		ConfigurationModule.register(TOOL_CONFIG_TOKEN, ToolConfig),
	],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolUtilizationMapper,
		ToolContextMapper,
		DatasheetPdfService,
		ExternalToolAuthorizableService,
		ExternalToolImageService,
		ExternalToolRule,
		ExternalToolLogoSanitizerService,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolParameterValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		DatasheetPdfService,
		ExternalToolImageService,
		ExternalToolLogoSanitizerService,
	],
})
export class ExternalToolModule {}
