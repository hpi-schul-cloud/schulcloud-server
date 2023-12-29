import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ClassService } from './service';
import { ClassesRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [ClassService, ClassesRepo],
	exports: [ClassService],
})
export class ClassModule {}
