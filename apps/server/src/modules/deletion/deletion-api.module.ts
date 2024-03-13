import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthenticationModule } from '@modules/authentication';
import { DeletionRequestsController } from './api/controller/deletion-requests.controller';
import { DeletionExecutionsController } from './api/controller/deletion-executions.controller';
import { DeletionRequestUc } from './api/uc';
import { DeletionModule } from '.';

@Module({
	imports: [CqrsModule, DeletionModule, LoggerModule, AuthenticationModule],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [DeletionRequestUc],
})
export class DeletionApiModule {}
