import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ClassesRepo } from './repo';
import { DeleteUserClassDataStep } from './saga';
import { ClassService } from './service';
import { SagaModule } from '@modules/saga';
import { UserChangedSchoolHandlerService } from './service/user-changed-school-handler.service';

@Module({
	imports: [LoggerModule, SagaModule],
	providers: [ClassService, ClassesRepo, DeleteUserClassDataStep, UserChangedSchoolHandlerService],
	exports: [ClassService],
})
export class ClassModule {}
