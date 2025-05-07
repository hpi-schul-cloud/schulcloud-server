import { LoggerModule } from '@core/logger';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ContextExternalToolRepo } from '../context-external-tool/repo';
import { ExternalToolRepo } from '../external-tool/repo';
import { SchoolExternalToolRepo } from '../school-external-tool/repo';
import {
	CommonToolDeleteService,
	CommonToolService,
	CommonToolValidationService,
	Lti11EncryptionService,
} from './service';

@Module({
	imports: [LoggerModule, SchoolModule, CqrsModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [
		CommonToolService,
		CommonToolValidationService,
		ExternalToolRepo,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolDeleteService,
		Lti11EncryptionService,
	],
	exports: [
		CommonToolService,
		CommonToolValidationService,
		ExternalToolRepo,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolDeleteService,
		Lti11EncryptionService,
	],
})
export class CommonToolModule {}
