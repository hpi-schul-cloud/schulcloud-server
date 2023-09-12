import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolYearRepo } from './repo';
import { SchoolService, SchoolValidationService, SchoolYearService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService, SchoolYearService, SchoolYearRepo, SchoolValidationService],
	exports: [SchoolService, SchoolYearService],
})
export class SchoolModule {}
