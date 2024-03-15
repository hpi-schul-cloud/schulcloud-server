import { Module, forwardRef } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ToolConfigModule } from '../tool-config.module';
import { ContextExternalToolAuthorizableService, ContextExternalToolService, ToolReferenceService } from './service';
import { ContextExternalToolValidationService } from './service/context-external-tool-validation.service';
import { ToolVersionService } from './service/tool-version-service';

@Module({
	imports: [
		forwardRef(() => CommonToolModule),
		forwardRef(() => ExternalToolModule),
		SchoolExternalToolModule,
		LoggerModule,
		ToolConfigModule,
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
