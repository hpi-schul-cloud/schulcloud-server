import { LoggerModule } from '@core/logger';
import { BoardModule } from '@modules/board';
import { SchoolModule } from '@modules/school';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExternalToolRepo } from '@shared/repo/externaltool';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool';
import {
	CommonToolDeleteService,
	CommonToolService,
	CommonToolValidationService,
	Lti11EncryptionService,
} from './service';
import { CommonToolMetadataService } from './service/common-tool-metadata.service';
import { ContextExternalToolRepo } from '../context-external-tool/repo/mikro-orm';

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
