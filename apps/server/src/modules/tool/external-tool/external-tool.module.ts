import { EncryptionModule } from '@infra/encryption';
import { OauthProviderServiceModule } from '@infra/oauth-provider';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PDFModule } from '@pyxlab/nestjs-pdf';
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
	imports: [
		CommonToolModule,
		ToolConfigModule,
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule,
		HttpModule,
		PDFModule.register({
			view: {
				// TODO: can we do this better e.g. make it relative to the module file
				root: 'apps/server/src/modules/tool/external-tool/mustache-template',
				engine: 'mustache',
				engineOptions: {
					cache: true,
				},
			},
		}),
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
		ExternalToolMetadataMapper,
		ToolContextMapper,
	],
	exports: [
		PDFModule,
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolVersionIncrementService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
	],
})
export class ExternalToolModule {}
