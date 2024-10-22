import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolRule } from './authorization/school-external-tool.rule';
import {
	SchoolExternalToolAuthorizableService,
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
} from './service';

@Module({
	imports: [forwardRef(() => CommonToolModule), forwardRef(() => ExternalToolModule), AuthorizationModule],
	providers: [
		SchoolExternalToolService,
		SchoolExternalToolValidationService,
		SchoolExternalToolRule,
		SchoolExternalToolAuthorizableService,
	],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService],
})
export class SchoolExternalToolModule {}
