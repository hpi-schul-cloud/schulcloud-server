import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { DemoSchoolRepo } from './repo/demo-school.repo';
import { DemoSchoolService } from './service/demo-school.service';

@Module({
	imports: [LoggerModule],
	providers: [DemoSchoolService, DemoSchoolRepo],
	exports: [DemoSchoolService],
})
export class DemoModule {}
