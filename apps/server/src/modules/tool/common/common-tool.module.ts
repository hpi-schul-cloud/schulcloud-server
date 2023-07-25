import { Module } from '@nestjs/common';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CommonToolService } from './service';

@Module({
	imports: [LoggerModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [CommonToolService, SchoolExternalToolRepo, ContextExternalToolRepo],
	exports: [CommonToolService, SchoolExternalToolRepo, ContextExternalToolRepo],
})
export class CommonToolModule {}
