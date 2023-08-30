import { Module } from '@nestjs/common';
import { FederalStateRepo, SchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolYearRepo } from './repo';
import { FederalStateService, LegacySchoolService, SchoolValidationService, SchoolYearService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [
		SchoolRepo,
		LegacySchoolService,
		SchoolYearService,
		SchoolYearRepo,
		FederalStateService,
		FederalStateRepo,
		SchoolValidationService,
	],
	exports: [LegacySchoolService, SchoolYearService, FederalStateService],
})
export class SchoolModule {}
