import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import {
	ContextExternalToolAuthorizableService,
	ContextExternalToolService,
	ContextExternalToolValidationService,
} from './service';
import { CommonToolModule } from '../common';

@Module({
	// TODO: remove authorization module here N21-1055
	imports: [
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		LoggerModule,
		forwardRef(() => AuthorizationModule),
	],
	providers: [ContextExternalToolService, ContextExternalToolValidationService, ContextExternalToolAuthorizableService],
	exports: [ContextExternalToolService, ContextExternalToolValidationService, ContextExternalToolAuthorizableService],
})
export class ContextExternalToolModule {}
