import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user';
import { DeletionModule } from '.';
import { DeletionBatchController } from './api/controller/deletion-batch.controller';
import { DeletionExecutionController } from './api/controller/deletion-execution.controller';
import { DeletionRequestController } from './api/controller/deletion-request.controller';
import { DeletionRequestUc } from './api/uc';
import { DeletionBatchUc } from './api/uc/deletion-batch.uc';

@Module({
	imports: [LoggerModule, DeletionModule, UserModule],
	controllers: [DeletionRequestController, DeletionExecutionController, DeletionBatchController],
	providers: [DeletionRequestUc, DeletionBatchUc],
})
export class DeletionApiModule {}
