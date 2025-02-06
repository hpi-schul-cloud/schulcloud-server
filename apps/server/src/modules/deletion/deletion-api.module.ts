import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { ClassModule } from '@modules/class';
import { FilesModule } from '@modules/files';
import { NewsModule } from '@modules/news';
import { PseudonymModule } from '@modules/pseudonym';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { TeamsModule } from '@modules/teams';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DeletionModule } from '.';
import { DeletionExecutionController } from './api/controller/deletion-execution.controller';
import { DeletionRequestController } from './api/controller/deletion-request.controller';
import { DeletionRequestUc } from './api/uc';
import { DeletionBatchUc } from './api/uc/deletion-batch.uc';
import { DeletionBatchController } from './api/controller/deletion-batch.controller';
import { UserModule } from '@modules/user';

// The most of this imports should not be part of the api module.
@Module({
	imports: [
		CalendarModule,
		CqrsModule,
		DeletionModule,
		LoggerModule,
		ClassModule,
		NewsModule,
		TeamsModule,
		PseudonymModule,
		FilesModule,
		RocketChatUserModule,
		UserModule,
	],
	controllers: [DeletionRequestController, DeletionExecutionController, DeletionBatchController],
	providers: [DeletionRequestUc, DeletionBatchUc],
})
export class DeletionApiModule {}
