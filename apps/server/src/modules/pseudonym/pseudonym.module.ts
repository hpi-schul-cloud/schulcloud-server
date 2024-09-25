import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { PseudonymService } from './service';

// Why import this module LearnroomModule and ToolModule, The UserModule should also checked, but maybe it is ok.
@Module({
	imports: [LoggerModule, CqrsModule],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger],
	exports: [PseudonymService],
})
export class PseudonymModule {}
