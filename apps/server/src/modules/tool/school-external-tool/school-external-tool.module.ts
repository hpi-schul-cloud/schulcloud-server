import { Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { SchoolExternalToolService, SchoolExternalToolValidationService,  SchoolExternalToolMetadataService } from './service';
import { ExternalToolModule } from '../external-tool';
import { ToolConfigModule } from '../tool-config.module';

@Module({
	imports: [CommonToolModule, ExternalToolModule, ToolConfigModule],
	providers: [SchoolExternalToolService, SchoolExternalToolValidationService,  SchoolExternalToolMetadataService],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService,  SchoolExternalToolMetadataService],
})
export class SchoolExternalToolModule {}
