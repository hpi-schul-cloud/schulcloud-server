import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthenticationModule } from '@modules/authentication';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { DeletionRequestsController } from './api/controller/deletion-requests.controller';
import { DeletionExecutionsController } from './api/controller/deletion-executions.controller';
import { DeletionRequestUc } from './api/uc';
import { DeletionModule } from '.';
import { ClassModule } from '../class';
import { NewsModule } from '../news';
import { TeamsModule } from '../teams';
import { PseudonymModule } from '../pseudonym';
import { FilesModule } from '../files';

@Module({
	imports: [
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
