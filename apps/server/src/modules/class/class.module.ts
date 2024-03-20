import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { ClassService } from './service';
import { ClassesRepo } from './repo';

@Module({
	imports: [CqrsModule, LoggerModule],
	providers: [ClassService, ClassesRepo],
	exports: [ClassService],
})
export class ClassModule {}
