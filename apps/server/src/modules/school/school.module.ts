import { Module } from '@nestjs/common';
import { FederalStateRepo, LegacySchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolYearRepo } from './repo';
import { LegacySchoolService, SchoolValidationService, SchoolYearService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [
		LegacySchoolRepo,
		LegacySchoolService,
		SchoolYearService,
		SchoolYearRepo,
		FederalStateRepo,
		SchoolValidationService,
	],
	exports: [LegacySchoolService, SchoolYearService],
})
export class SchoolModule {}
