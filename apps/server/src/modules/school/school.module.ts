import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LoggerModule } from '@src/core/logger';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService],
	exports: [SchoolService],
})
export class SchoolModule {}
