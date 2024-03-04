import { Configuration } from '@hpi-schul-cloud/commons';
import { AccountModule } from '@modules/account';
import { AuthenticationModule } from '@modules/authentication';
import { ClassModule } from '@modules/class';
import { DeletionModule } from '@modules/deletion';
import { FilesModule } from '@modules/files';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { PseudonymModule } from '@modules/pseudonym';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RocketChatModule } from '@modules/rocketchat';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { TaskModule } from '@modules/task';
import { TeamsModule } from '@modules/teams';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { NewsModule } from '../news';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionRequestUc } from './uc';

@Module({
	imports: [
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
