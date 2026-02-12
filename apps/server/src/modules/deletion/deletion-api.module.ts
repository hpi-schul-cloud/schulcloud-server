import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { DeletionModule } from '.';
import { DeletionBatchController } from './api/controller/deletion-batch.controller';
import { DeletionExecutionController } from './api/controller/deletion-execution.controller';
import { DeletionRequestController } from './api/controller/deletion-request.controller';
import { DeletionRequestPublicController } from './api/controller/deletion-request-public.controller';
import { DeletionRequestUc, DeletionRequestPublicUc } from './api/uc';
import { DeletionBatchUc } from './api/uc/deletion-batch.uc';
import { AccountModule } from '../account';

@Module({
	imports: [LoggerModule, DeletionModule, SagaModule, UserModule, AccountModule, AuthorizationModule],
	controllers: [
		DeletionRequestController,
		DeletionRequestPublicController,
		DeletionExecutionController,
		DeletionBatchController,
	],
	providers: [DeletionRequestUc, DeletionRequestPublicUc, DeletionBatchUc],
})
export class DeletionApiModule {}
