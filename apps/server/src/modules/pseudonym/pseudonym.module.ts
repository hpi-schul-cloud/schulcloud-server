import { LegacyLogger, LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExternalToolPseudonymRepo } from './repo';
import { PseudonymService } from './service';

@Module({
	imports: [LoggerModule, CqrsModule],
	providers: [PseudonymService, ExternalToolPseudonymRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
