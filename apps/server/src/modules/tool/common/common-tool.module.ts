import { BoardModule } from '@modules/board';
import { forwardRef, Module } from '@nestjs/common';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school';
import { CommonToolService, CommonToolValidationService } from './service';
import { CommonToolMetadataService } from './service/common-tool-metadata.service';

@Module({
	imports: [LoggerModule, SchoolModule, forwardRef(() => BoardModule)],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [
		CommonToolService,
		CommonToolValidationService,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolMetadataService,
	],
	exports: [
		CommonToolService,
		CommonToolValidationService,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolMetadataService,
	],
})
export class CommonToolModule {}
