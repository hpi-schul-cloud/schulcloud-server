import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '@hpi-schul-cloud/commons';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AccountModule } from '@modules/account';
import { ClassModule } from '@modules/class';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { PseudonymModule } from '@modules/pseudonym';
import { TeamsModule } from '@modules/teams';
import { UserModule } from '@modules/user';
import { RocketChatModule } from '@modules/rocketchat';
import { FilesModule } from '@modules/files';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { XApiKeyConfig } from '../authentication/config/x-api-key.config';
import { DeletionRequestUc } from './uc/deletion-request.uc';
import { DeletionLogService } from './services/deletion-log.service';
import { RocketChatUserModule } from '../rocketchat-user';
import { DeletionLogRepo } from './repo';

@Module({
	imports: [
		LoggerModule,
		AuthenticationModule,
		AccountModule,
		ClassModule,
		LearnroomModule,
		LessonModule,
		PseudonymModule,
		TeamsModule,
		UserModule,
		RocketChatModule.forRoot({
			uri: Configuration.get('ROCKET_CHAT_URI') as string,
			adminId: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
			adminToken: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
			adminUser: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
			adminPassword: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
		}),
		RocketChatUserModule,
		FilesModule,
	],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		ConfigService<XApiKeyConfig, true>,
		DeletionRequestUc,
		DeletionLogService,
		DeletionRequestService,
	],
	exports: [DeletionRequestService, DeletionLogService],
})
export class DeletionModule {}
