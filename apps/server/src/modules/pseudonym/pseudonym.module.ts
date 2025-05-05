import { LegacyLogger, LoggerModule } from '@core/logger';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { ExternalToolPseudonymRepo } from './repo';
import { DeleteUserPseudonymDataStep } from './saga';
import { PseudonymService } from './service';

@Module({
	imports: [LoggerModule, SagaModule],
	providers: [PseudonymService, ExternalToolPseudonymRepo, LegacyLogger, DeleteUserPseudonymDataStep, SagaModule],
	exports: [PseudonymService],
})
export class PseudonymModule {}
