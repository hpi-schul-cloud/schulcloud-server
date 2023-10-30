import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { CommonToolModule } from '../common/common-tool.module';
import { ExternalToolModule } from '../external-tool/external-tool.module';
import { SchoolExternalToolModule } from '../school-external-tool/school-external-tool.module';
import { ContextExternalToolAuthorizableService } from './service/context-external-tool-authorizable.service';
import { ContextExternalToolValidationService } from './service/context-external-tool-validation.service';
import { ContextExternalToolService } from './service/context-external-tool.service';
import { ToolReferenceService } from './service/tool-reference.service';

@Module({
	imports: [CommonToolModule, ExternalToolModule, SchoolExternalToolModule, LoggerModule],
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
