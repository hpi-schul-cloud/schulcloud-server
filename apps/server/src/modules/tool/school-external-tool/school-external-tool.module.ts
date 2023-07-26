import { Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from './service';
import { ExternalToolModule } from '../external-tool';

@Module({
	imports: [CommonToolModule, ExternalToolModule],
	providers: [SchoolExternalToolService, SchoolExternalToolValidationService],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService],
})
export class SchoolExternalToolModule {}
