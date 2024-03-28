import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthenticationModule } from '@modules/authentication';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { Configuration } from '@hpi-schul-cloud/commons';
import { RocketChatModule } from '@modules/rocketchat';
import { RegistrationPinModule } from '@modules/registration-pin';
import { TaskModule } from '@modules/task';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { CqrsModule } from '@nestjs/cqrs';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { DeletionRequestUc } from './uc';
import { NewsModule } from '../news';
import { ClassModule } from '@modules/class';
import { NewsModule } from '@modules/news';
import { TeamsModule } from '@modules/teams';
import { PseudonymModule } from '@modules/pseudonym';
import { FilesModule } from '@modules/files';
import { DeletionModule } from '.';
import { DeletionRequestUc } from './api/uc';
import { DeletionExecutionsController } from './api/controller/deletion-executions.controller';
import { DeletionRequestsController } from './api/controller/deletion-requests.controller';

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
