import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { ExternalToolRepo } from '@shared/repo';
import { ToolConfigModule } from '../tool-config.module';
import {
	ExternalToolParameterValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
	ExternalToolVersionService,
} from './service';
import { CommonToolModule } from '../common';

@Module({
	imports: [CommonToolModule, ToolConfigModule, LoggerModule, OauthProviderServiceModule, EncryptionModule],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		ExternalToolParameterValidationService,
		ExternalToolValidationService,
		ExternalToolVersionService,
		ExternalToolRepo,
	],
	exports: [ExternalToolService, ExternalToolValidationService, ExternalToolVersionService],
})
export class ExternalToolModule {}
