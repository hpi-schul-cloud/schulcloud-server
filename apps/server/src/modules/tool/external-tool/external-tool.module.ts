import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { ExternalToolRepo } from '@shared/repo';
import {
	ExternalToolConfigurationService,
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
	ExternalToolVersionService,
} from './service';
import { CommonToolModule } from '../common';
import { ToolConfigModule } from '../tool-config.module';

@Module({
	imports: [CommonToolModule, LoggerModule, OauthProviderServiceModule, EncryptionModule, ToolConfigModule],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolVersionService,
		ExternalToolConfigurationService,
		ExternalToolRepo,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		ExternalToolVersionService,
		ExternalToolConfigurationService,
	],
})
export class ExternalToolModule {}
