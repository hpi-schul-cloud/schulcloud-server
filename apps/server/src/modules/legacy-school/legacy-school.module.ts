import { Module } from '@nestjs/common';
import { FederalStateRepo, LegacySchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolSystemOptionsRepo, SchoolYearRepo } from './repo';
import {
	FederalStateService,
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchoolValidationService,
	SchoolYearService,
} from './service';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Module({
	imports: [LoggerModule],
	providers: [
		LegacySchoolRepo,
		LegacySchoolService,
		SchoolYearService,
		SchoolYearRepo,
		FederalStateService,
		FederalStateRepo,
		SchoolValidationService,
		SchoolSystemOptionsRepo,
		SchoolSystemOptionsService,
	],
	exports: [LegacySchoolService, SchoolYearService, FederalStateService, SchoolSystemOptionsService],
})
export class LegacySchoolModule {}
