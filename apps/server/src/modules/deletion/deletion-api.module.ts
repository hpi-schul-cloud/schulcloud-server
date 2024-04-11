import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthenticationModule } from '@modules/authentication';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { ClassModule } from '@modules/class';
import { NewsModule } from '@modules/news';
import { TeamsModule } from '@modules/teams';
import { PseudonymModule } from '@modules/pseudonym';
import { FilesModule } from '@modules/files';
import { CalendarModule } from '@src/infra/calendar';
import { DeletionModule } from '.';
import { DeletionRequestUc } from './api/uc';
import { DeletionExecutionsController } from './api/controller/deletion-executions.controller';
import { DeletionRequestsController } from './api/controller/deletion-requests.controller';

@Module({
	imports: [
		CalendarModule,
		CqrsModule,
		DeletionModule,
		LoggerModule,
		AuthenticationModule,
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
