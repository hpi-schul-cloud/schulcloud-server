import { Module } from '@nestjs/common';
import { CommonToolModule } from '../common/common-tool.module';
import { ExternalToolModule } from '../external-tool/external-tool.module';
import { SchoolExternalToolValidationService } from './service/school-external-tool-validation.service';
import { SchoolExternalToolService } from './service/school-external-tool.service';

@Module({
	imports: [CommonToolModule, ExternalToolModule],
	providers: [SchoolExternalToolService, SchoolExternalToolValidationService],
	exports: [SchoolExternalToolService, SchoolExternalToolValidationService],
})
export class SchoolExternalToolModule {}
