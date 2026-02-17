import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { DeletionModule } from '.';
import { AccountModule } from '../account';
import { DeletionBatchController } from './api/controller/deletion-batch.controller';
import { DeletionExecutionController } from './api/controller/deletion-execution.controller';
import { DeletionRequestPublicController } from './api/controller/deletion-request-public.controller';
import { DeletionRequestController } from './api/controller/deletion-request.controller';
import { DeletionRequestPublicUc, DeletionRequestUc } from './api/uc';
import { DeletionBatchUc } from './api/uc/deletion-batch.uc';
import { DELETION_CONFIG_TOKEN, DeletionConfig } from './deletion.config';
import { AuthenticationApiModule } from '@modules/authentication/authentication-api.module';

@Module({
	imports: [
		LoggerModule,
		DeletionModule,
		SagaModule,
		UserModule,
		AccountModule,
		AuthenticationApiModule,
		AuthorizationModule,
		ConfigurationModule.register(DELETION_CONFIG_TOKEN, DeletionConfig),
	],
	controllers: [
		DeletionRequestController,
		DeletionRequestPublicController,
		DeletionExecutionController,
		DeletionBatchController,
	],
	providers: [DeletionRequestUc, DeletionRequestPublicUc, DeletionBatchUc],
})
export class DeletionApiModule {}
