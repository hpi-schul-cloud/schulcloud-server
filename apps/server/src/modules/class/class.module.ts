import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { DeletionModule } from '@modules/deletion';
import { ClassService } from './service';
import { ClassesRepo } from './repo';

@Module({
	imports: [LoggerModule, DeletionModule],
	providers: [ClassService, ClassesRepo],
	exports: [ClassService],
})
export class ClassModule {}
