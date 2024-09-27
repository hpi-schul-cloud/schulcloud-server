import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import {
	SchoolExternalToolAuthorizableService,
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
} from './service';
import { SchoolExternalToolRule } from './authorization/school-external-tool.rule';

@Module({
	imports: [forwardRef(() => CommonToolModule), forwardRef(() => ExternalToolModule)],
	providers: [
		SchoolExternalToolService,
		SchoolExternalToolValidationService,
		SchoolExternalToolRule,
		SchoolExternalToolAuthorizableService,
	],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService],
})
export class SchoolExternalToolModule {}
