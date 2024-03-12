import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { DeletionRequestUc } from './uc';
import { DeletionModule } from '.';

@Module({
	imports: [CqrsModule, DeletionModule, LoggerModule],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [DeletionRequestUc],
})
export class DeletionApiModule {}
