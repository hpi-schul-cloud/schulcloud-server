import { Module } from '@nestjs/common';
import { ClassService } from './service';
import { ClassesRepo } from './repo';

@Module({
	providers: [ClassService, ClassesRepo],
	exports: [ClassService],
})
export class ClassModule {}
