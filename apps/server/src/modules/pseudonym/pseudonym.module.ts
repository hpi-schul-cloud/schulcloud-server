import { LegacyLogger, LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ExternalToolPseudonymRepo } from './repo';
import { DeleteUserPseudonymDataStep } from './saga';
import { PseudonymService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [PseudonymService, ExternalToolPseudonymRepo, LegacyLogger, DeleteUserPseudonymDataStep],
	exports: [PseudonymService],
})
export class PseudonymModule {}
