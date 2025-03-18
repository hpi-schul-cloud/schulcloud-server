import { LoggerModule } from '@core/logger';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClassesRepo } from './repo';
import { DeleteUserReferenceFromClassStep } from './saga';
import { ClassService } from './service';

@Module({
	imports: [CqrsModule, LoggerModule, SagaModule],
	providers: [ClassService, ClassesRepo, DeleteUserReferenceFromClassStep],
	exports: [ClassService],
})
export class ClassModule {}
