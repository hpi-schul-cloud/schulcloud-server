import { Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { DeletionRequestUc } from './uc';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { DeletionRequestsController } from './controller/deletion-requests.controller';

@Module({
	imports: [CqrsModule, DeletionModule, LoggerModule],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [DeletionRequestUc],
})
export class DeletionApiModule {}
