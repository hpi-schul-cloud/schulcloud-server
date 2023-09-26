import { Module } from '@nestjs/common';
import { LegacySchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { FederalStateService } from '@src/modules/federal-state';
import { FederalStateRepo } from '../federal-state/repo';
import { SchoolYearRepo } from './repo';
import { LegacySchoolService, SchoolValidationService, SchoolYearService } from './service';

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
