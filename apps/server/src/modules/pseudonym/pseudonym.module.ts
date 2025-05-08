import { LegacyLogger, LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ExternalToolPseudonymRepo } from './repo';
import { PseudonymService } from './service';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [LoggerModule, DeletionModule],
	providers: [PseudonymService, ExternalToolPseudonymRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
