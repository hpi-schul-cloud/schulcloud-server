import { Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@modules/authentication';
import { CqrsModule } from '@nestjs/cqrs';
import { Configuration } from '@hpi-schul-cloud/commons';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { DeletionRequestUc } from './uc';
import { LearnroomModule } from '../learnroom';
import { AccountModule } from '../account';
import { ClassModule } from '../class';
import { FilesModule } from '../files';
import { FilesStorageClientModule } from '../files-storage-client';
import { LessonModule } from '../lesson';
import { NewsModule } from '../news';
import { PseudonymModule } from '../pseudonym';
import { RegistrationPinModule } from '../registration-pin';
import { RocketChatModule } from '../rocketchat';
import { RocketChatUserModule } from '../rocketchat-user';
import { TaskModule } from '../task';
import { TeamsModule } from '../teams';
import { UserModule } from '../user';

@Module({
	imports: [
		CqrsModule,
		DeletionModule,
		AccountModule,
		ClassModule,
		LearnroomModule,
		FilesModule,
		LessonModule,
		PseudonymModule,
		TeamsModule,
		UserModule,
		LoggerModule,
		AuthenticationModule,
		RocketChatUserModule,
		RegistrationPinModule,
		FilesStorageClientModule,
		TaskModule,
		NewsModule,
		RocketChatModule.forRoot({
			uri: Configuration.get('ROCKET_CHAT_URI') as string,
			adminId: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
			adminToken: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
			adminUser: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
			adminPassword: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
		}),
	],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [DeletionRequestUc],
})
export class DeletionApiModule {}
