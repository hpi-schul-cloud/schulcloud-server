import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { DeletionModule } from '@modules/deletion';
import { ClassService } from './service';
import { ClassesRepo } from './repo';

@Module({
	imports: [CqrsModule, LoggerModule, forwardRef(() => DeletionModule)],
	providers: [ClassService, ClassesRepo],
	exports: [ClassService],
})
export class ClassModule {}
