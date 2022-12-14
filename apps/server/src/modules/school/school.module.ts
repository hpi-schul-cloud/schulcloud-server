import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school/service/school.service';
import { Logger, LoggerModule } from '../../core/logger';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService, Logger],
	exports: [SchoolService],
})
export class SchoolModule {}
