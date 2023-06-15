import { Module } from '@nestjs/common';
import { FederalStateRepo, SchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolYearRepo } from '@shared/repo/schoolyear';
import { FederalStateService, SchoolService, SchoolYearService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService, SchoolYearService, SchoolYearRepo, FederalStateService, FederalStateRepo],
	exports: [SchoolService, SchoolYearService, FederalStateService],
})
export class SchoolModule {}
