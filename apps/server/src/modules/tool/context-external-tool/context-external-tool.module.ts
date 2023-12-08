import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { EventModule } from '@src/infra/event';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ContextExternalToolAuthorizableService, ContextExternalToolService, ToolReferenceService } from './service';
import { ContextExternalToolValidationService } from './service/context-external-tool-validation.service';
import { ToolConfigModule } from '../tool-config.module';
import { ToolVersionService } from './service/tool-version-service';

@Module({
	imports: [
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		LoggerModule,
		ToolConfigModule,
		EventModule,
	],
	providers: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
		ToolVersionService,
	],
	exports: [
		ContextExternalToolService,
		ContextExternalToolValidationService,
		ContextExternalToolAuthorizableService,
		ToolReferenceService,
		ToolVersionService,
	],
})
export class ContextExternalToolModule {}
