import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from './service';

@Module({
	imports: [forwardRef(() => CommonToolModule), forwardRef(() => ExternalToolModule)],
	providers: [SchoolExternalToolService, SchoolExternalToolValidationService],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService],
})
export class SchoolExternalToolModule {}
