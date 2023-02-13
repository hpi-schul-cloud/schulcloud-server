import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LoggerModule } from '@src/core/logger';
import { SchoolMapper } from './mapper/school.mapper';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService, SchoolMapper],
	exports: [SchoolService, SchoolMapper],
})
export class SchoolModule {}
