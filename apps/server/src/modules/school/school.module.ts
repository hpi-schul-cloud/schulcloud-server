import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolYearRepo } from '@shared/repo/schoolyear';
import { SchoolService, SchoolYearService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService, SchoolYearService, SchoolYearRepo],
	exports: [SchoolService, SchoolYearService],
})
export class SchoolModule {}
