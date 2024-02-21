import { Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';
import { AccountModule } from '@modules/account';
import { ClassModule } from '@modules/class';
import { LearnroomModule } from '@modules/learnroom';
import { FilesModule } from '@modules/files';
import { PseudonymModule } from '@modules/pseudonym';
import { LessonModule } from '@modules/lesson';
import { TeamsModule } from '@modules/teams';
import { UserModule } from '@modules/user';
import { LoggerModule } from '@src/core/logger';
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
