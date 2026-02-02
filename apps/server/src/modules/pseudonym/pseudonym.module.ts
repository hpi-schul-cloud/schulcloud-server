import { LegacyLogger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { PSEUDONYM_CONFIG_TOKEN, PseudonymConfig } from './pseudonym.config';
import { ExternalToolPseudonymRepo } from './repo';
import { DeleteUserPseudonymDataStep } from './saga';
import { PseudonymService } from './service';

@Module({
	imports: [LoggerModule, SagaModule, ConfigurationModule.register(PSEUDONYM_CONFIG_TOKEN, PseudonymConfig)],
	providers: [PseudonymService, ExternalToolPseudonymRepo, LegacyLogger, DeleteUserPseudonymDataStep],
	exports: [PseudonymService],
})
export class PseudonymModule {}
