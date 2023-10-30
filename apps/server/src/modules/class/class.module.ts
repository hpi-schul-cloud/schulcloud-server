import { Module } from '@nestjs/common';
import { ClassesRepo } from './repo/classes.repo';
import { ClassService } from './service/class.service';

@Module({
	providers: [ClassService, ClassesRepo],
	exports: [ClassService],
})
export class ClassModule {}
