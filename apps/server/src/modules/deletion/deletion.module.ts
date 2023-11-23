import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CourseGroupRepo } from '@shared/repo';
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
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';
import { DeletionRequestsController } from './controller/deletion-requests.controller';
import { DeletionExecutionsController } from './controller/deletion-executions.controller';
import { XApiKeyConfig } from '../authentication/config/x-api-key.config';
import { DeletionRequestUc } from './uc/deletion-request.uc';
import { DeletionLogService } from './services/deletion-log.service';
import { CourseGroupService } from '../learnroom/service';
import { FilesService } from '../files/service';
import { RocketChatUserService } from '../rocketchat-user';
import { DeletionLogRepo } from './repo';
import { FilesRepo } from '../files/repo';
import { RocketChatUserRepo } from '../rocketchat-user/repo';

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
	],
	controllers: [DeletionRequestsController, DeletionExecutionsController],
	providers: [
		DeletionRequestService,
		DeletionRequestRepo,
		ConfigService<XApiKeyConfig, true>,
		DeletionRequestUc,
		DeletionLogService,
		CourseGroupService,
		FilesService,
		DeletionLogRepo,
		CourseGroupRepo,
		FilesRepo,
		RocketChatUserService,
		RocketChatUserRepo,
	],
	exports: [DeletionRequestService],
})
export class DeletionModule {}
