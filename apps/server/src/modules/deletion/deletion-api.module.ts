import { Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@modules/authentication';
import { CqrsModule } from '@nestjs/cqrs';
import { Configuration } from '@hpi-schul-cloud/commons';
import { LearnroomModule } from '@modules/learnroom';
import { AccountModule } from '@modules/account';
import { ClassModule } from '@modules/class';
import { FilesModule } from '@modules/files';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { LessonModule } from '@modules/lesson';
import { NewsModule } from '@modules/news';
import { PseudonymModule } from '@modules/pseudonym';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RocketChatModule } from '@modules/rocketchat';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { TaskModule } from '@modules/task';
import { TeamsModule } from '@modules/teams';
import { UserModule } from '@modules/user';
import { DeletionRequestUc } from './uc';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { DeletionRequestsController } from './controller/deletion-requests.controller';

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
