import { LoggerModule } from '@core/logger';
import { EncryptionModule } from '@infra/encryption';
import { FilesStorageClientModule } from '@infra/files-storage-client';
import { AuthorizationModule } from '@modules/authorization';
import { OauthProviderServiceModule } from '@modules/oauth-provider';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { InstanceModule } from '../../instance';
import { CommonToolModule } from '../common';
import { ToolContextMapper } from '../common/mapper/tool-context.mapper';
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
import { EncryptionConfig } from './encryption.config';

@Module({
	imports: [
		CommonToolModule,
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule.register(EncryptionConfig),
		HttpModule,
		InstanceModule,
		AuthorizationModule,
		FilesStorageClientModule,
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
