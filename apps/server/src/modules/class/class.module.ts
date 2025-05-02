import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ClassesRepo } from './repo';
import { DeleteUserClassDataStep } from './saga';
import { ClassService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [ClassService, ClassesRepo, DeleteUserClassDataStep],
	exports: [ClassService],
})
export class ClassModule {}
