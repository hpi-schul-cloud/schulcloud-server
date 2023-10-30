import { Module } from '@nestjs/common';
import { FederalStateRepo } from '@shared/repo/federalstate/federal-state.repo';
import { LegacySchoolRepo } from '@shared/repo/school/legacy-school.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { SchoolYearRepo } from './repo/schoolyear.repo';
import { FederalStateService } from './service/federal-state.service';
import { LegacySchoolService } from './service/legacy-school.service';
import { SchoolYearService } from './service/school-year.service';
import { SchoolValidationService } from './service/validation/school-validation.service';

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
