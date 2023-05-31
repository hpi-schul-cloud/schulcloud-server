import { Module } from '@nestjs/common';
import { SchoolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [SchoolRepo, SchoolService],
	exports: [SchoolService],
})
export class SchoolModule {}
