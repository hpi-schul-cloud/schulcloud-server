import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { SagaModule } from '@modules/saga';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { DeletionModule } from '.';
import { AccountModule } from '../account';
import { DeletionBatchController } from './api/controller/deletion-batch.controller';
import { DeletionExecutionController } from './api/controller/deletion-execution.controller';
import { DeletionRequestController } from './api/controller/deletion-request.controller';
import { DeletionRequestUc } from './api/uc';
import { DeletionBatchUc } from './api/uc/deletion-batch.uc';
import { DELETION_CONFIG_TOKEN, DeletionConfig } from './deletion.config';

@Module({
	imports: [
		LoggerModule,
		DeletionModule,
		SagaModule,
		UserModule,
		AccountModule,
		ConfigurationModule.register(DELETION_CONFIG_TOKEN, DeletionConfig),
	],
	controllers: [DeletionRequestController, DeletionExecutionController, DeletionBatchController],
	providers: [DeletionRequestUc, DeletionBatchUc],
})
export class DeletionApiModule {}
