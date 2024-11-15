import { BoardModule } from '@modules/board';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school';
import {
	CommonToolDeleteService,
	CommonToolService,
	CommonToolValidationService,
	Lti11EncryptionService,
} from './service';
import { CommonToolMetadataService } from './service/common-tool-metadata.service';

@Module({
	imports: [LoggerModule, SchoolModule, forwardRef(() => BoardModule), CqrsModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [
		CommonToolService,
		CommonToolValidationService,
		ExternalToolRepo,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolMetadataService,
		CommonToolDeleteService,
		Lti11EncryptionService,
	],
	exports: [
		CommonToolService,
		CommonToolValidationService,
		ExternalToolRepo,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolMetadataService,
		CommonToolDeleteService,
		Lti11EncryptionService,
	],
})
export class CommonToolModule {}
