import { LoggerModule } from '@core/logger';
import { BoardModule } from '@modules/board';
import { SchoolModule } from '@modules/school';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ContextExternalToolRepo } from '../context-external-tool/repo/mikro-orm';
import { SchoolExternalToolRepo } from '../school-external-tool/repo';
import {
	CommonToolDeleteService,
	CommonToolService,
	CommonToolValidationService,
	Lti11EncryptionService,
} from './service';
import { ExternalToolRepo } from '../external-tool/repo/mikro-orm/external-tool.repo';
import { CommonToolUtilizationService } from './service/common-tool-utilization.service';

@Module({
	imports: [LoggerModule, SchoolModule, forwardRef(() => BoardModule), CqrsModule],
	// TODO: make deletion of entities cascading, adjust ExternalToolService.deleteExternalTool and remove the repos from here
	providers: [
		CommonToolService,
		CommonToolValidationService,
		ExternalToolRepo,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolUtilizationService,
		CommonToolDeleteService,
		Lti11EncryptionService,
	],
	exports: [
		CommonToolService,
		CommonToolValidationService,
		ExternalToolRepo,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		CommonToolUtilizationService,
		CommonToolDeleteService,
		Lti11EncryptionService,
	],
})
export class CommonToolModule {}
