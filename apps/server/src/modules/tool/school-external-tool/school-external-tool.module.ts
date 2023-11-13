import { Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import {
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
	SchoolExternalToolMetadataService,
} from './service';
import { ExternalToolModule } from '../external-tool';

@Module({
	imports: [CommonToolModule, ExternalToolModule],
	providers: [SchoolExternalToolService, SchoolExternalToolValidationService, SchoolExternalToolMetadataService],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService, SchoolExternalToolMetadataService],
})
export class SchoolExternalToolModule {}
