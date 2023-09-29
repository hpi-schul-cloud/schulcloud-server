import { Module } from '@nestjs/common';
import { LegacySchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolYearRepo } from './repo';
import { LegacySchoolService, SchoolValidationService, SchoolYearService } from './service';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Module({
	imports: [LoggerModule],
	providers: [LegacySchoolRepo, LegacySchoolService, SchoolYearService, SchoolYearRepo, SchoolValidationService],
	exports: [LegacySchoolService, SchoolYearService],
})
export class LegacySchoolModule {}
