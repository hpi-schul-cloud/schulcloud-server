import { CalendarModule } from '@infra/calendar';
import { ClassModule } from '@modules/class';
import { FilesModule } from '@modules/files';
import { NewsModule } from '@modules/news';
import { PseudonymModule } from '@modules/pseudonym';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { TeamsModule } from '@modules/teams';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggerModule } from '@src/core/logger';
import { DeletionModule } from '.';
import { DeletionExecutionsController } from './api/controller/deletion-executions.controller';
import { DeletionRequestsController } from './api/controller/deletion-requests.controller';
import { DeletionRequestUc } from './api/uc';

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
	],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [DeletionRequestUc],
})
export class DeletionApiModule {}
