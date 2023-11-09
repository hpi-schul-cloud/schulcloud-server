import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import {
	ContextExternalToolAuthorizableService,
	ContextExternalToolService,
	ContextExternalToolValidationService,
	ToolReferenceService,
} from './service';
import { ToolConfigModule } from '../tool-config.module';

@Module({
	imports: [CommonToolModule, ExternalToolModule, SchoolExternalToolModule, LoggerModule, ToolConfigModule],
	providers: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
	],
	exports: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
	],
})
export class ContextExternalToolModule {}
