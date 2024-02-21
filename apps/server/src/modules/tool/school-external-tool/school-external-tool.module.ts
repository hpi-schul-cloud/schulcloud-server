import { Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ExternalToolModule } from '../external-tool';
import { ToolConfigModule } from '../tool-config.module';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from './service';

@Module({
	imports: [CommonToolModule, ExternalToolModule, ToolConfigModule],
	providers: [SchoolExternalToolService, SchoolExternalToolValidationService],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService],
})
export class SchoolExternalToolModule {}
