import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption/encryption.module';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider/oauth-provider-service.module';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { CommonToolModule } from '../common/common-tool.module';
import { ToolConfigModule } from '../tool-config.module';
import { ExternalToolConfigurationService } from './service/external-tool-configuration.service';
import { ExternalToolLogoService } from './service/external-tool-logo.service';
import { ExternalToolParameterValidationService } from './service/external-tool-parameter-validation.service';
import { ExternalToolServiceMapper } from './service/external-tool-service.mapper';
import { ExternalToolValidationService } from './service/external-tool-validation.service';
import { ExternalToolVersionService } from './service/external-tool-version.service';
import { ExternalToolService } from './service/external-tool.service';

@Module({
	imports: [CommonToolModule, ToolConfigModule, LoggerModule, OauthProviderServiceModule, EncryptionModule, HttpModule],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolVersionService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
		ExternalToolRepo,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolVersionService,
		ExternalToolConfigurationService,
		ExternalToolLogoService,
	],
})
export class ExternalToolModule {}
