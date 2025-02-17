import { LoggerModule } from '@core/logger';
import { EncryptionModule } from '@infra/encryption';
import { AuthorizationModule } from '@modules/authorization';
import { OauthProviderServiceModule } from '@modules/oauth-provider';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { InstanceModule } from '../../instance';
import { CommonToolModule } from '../common';
import { ToolContextMapper } from '../common/mapper/tool-context.mapper';
import { ExternalToolRule } from './authorization/external-tool.rule';
import { ExternalToolMetadataMapper } from './mapper';
import {
	DatasheetPdfService,
	ExternalToolAuthorizableService,
	ExternalToolConfigurationService,
	ExternalToolImageService,
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
		EncryptionModule,
		HttpModule,
		InstanceModule,
		AuthorizationModule,
	],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolMetadataMapper,
		ToolContextMapper,
		DatasheetPdfService,
		ExternalToolAuthorizableService,
		ExternalToolImageService,
		ExternalToolRule,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		DatasheetPdfService,
		ExternalToolImageService,
	],
})
export class ExternalToolModule {}
