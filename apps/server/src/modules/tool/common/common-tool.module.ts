import { Module } from '@nestjs/common';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CommonToolService, CommonToolValidationService } from './service';

@Module({
	imports: [LoggerModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [CommonToolService, CommonToolValidationService, SchoolExternalToolRepo, ContextExternalToolRepo],
	exports: [CommonToolService, CommonToolValidationService, SchoolExternalToolRepo, ContextExternalToolRepo],
})
export class CommonToolModule {}
