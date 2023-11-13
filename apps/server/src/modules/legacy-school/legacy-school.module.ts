import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { LegacySchoolRepo, FederalStateRepo, SchoolYearRepo } from './repo';

import { FederalStateService, LegacySchoolService, SchoolValidationService, SchoolYearService } from './service';

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
	],
	exports: [LegacySchoolService, SchoolYearService, FederalStateService],
})
export class LegacySchoolModule {}
