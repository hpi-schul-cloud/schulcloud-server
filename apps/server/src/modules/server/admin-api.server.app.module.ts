import { LoggerModule } from '@core/logger';
import { ValidationModule } from '@core/validation';
import {
	AuthGuardModule,
	AuthGuardOptions,
	X_API_KEY_AUTH_GUARD_CONFIG_TOKEN,
	XApiKeyAuthGuardConfig,
} from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongoMemoryDatabaseModule } from '@testing/database';

import { LegacySchoolAdminApiModule } from '@modules/legacy-school/legacy-school-admin.api-module';
import { AdminApiRegistrationPinModule } from '@modules/registration-pin/admin-api-registration-pin.module';
import { ToolAdminApiModule } from '@modules/tool/tool-admin-api.module';
import { UserAdminApiModule } from '@modules/user/user-admin-api.module';

// needed for deletion module
import { AccountApiModule } from '@modules/account/account-api.module';
import { ClassModule } from '@modules/class';
import { CourseApiModule } from '@modules/course/course-api.module';
import { DeletionApiModule } from '@modules/deletion/deletion-api.module';
import { FilesModule } from '@modules/files';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { GroupApiModule } from '@modules/group/group-api.module';
import { LearnroomApiModule } from '@modules/learnroom/learnroom-api.module';
import { NewsModule } from '@modules/news';
import { PseudonymApiModule } from '@modules/pseudonym/pseudonym-api.module';
import { RocketChatModule } from '@modules/rocketchat';
import { RocketChatUserModule } from '@modules/rocketchat-user';
import { TaskApiModule } from '@modules/task/task-api.module';
import { TeamApiModule } from '@modules/team/team-api.module';
import { UserApiModule } from '@modules/user/user-api.module';

import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { MediaBoardApiModule } from '@modules/board/media-board-api.module';
import { RoomApiModule } from '@modules/room/room-api.module';
import { findOneOrFailHandler } from '@shared/common/database-error.handler';
import { ADMIN_API_SERVER_CONFIG_TOKEN, AdminApiServerConfig } from './admin-api-server.config';
import { ENTITIES, TEST_ENTITIES } from './admin-api-server.entity.imports';

const serverModules = [
	ConfigurationModule.register(ADMIN_API_SERVER_CONFIG_TOKEN, AdminApiServerConfig),
	ValidationModule,
	DeletionApiModule,
	LegacySchoolAdminApiModule,
	UserAdminApiModule,
	AdminApiRegistrationPinModule,
	ToolAdminApiModule,
	AuthGuardModule.register([
		{
			option: AuthGuardOptions.X_API_KEY,
			configInjectionToken: X_API_KEY_AUTH_GUARD_CONFIG_TOKEN,
			configConstructor: XApiKeyAuthGuardConfig,
		},
	]),
	AccountApiModule,
	MediaBoardApiModule,
	ClassModule,
	CourseApiModule,
	FilesModule,
	FilesStorageClientModule,
	GroupApiModule,
	LearnroomApiModule,
	NewsModule,
	PseudonymApiModule,
	RocketChatModule,
	RocketChatUserModule,
	TaskApiModule,
	TeamApiModule,
	UserApiModule,
	RoomApiModule,
];

@Module({
	imports: [
		...serverModules,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		CqrsModule,
		LoggerModule,
	],
})
export class AdminApiServerModule {}

@Module({
	imports: [
		...serverModules,
		MongoMemoryDatabaseModule.forRoot({ findOneOrFailHandler, entities: TEST_ENTITIES }),
		LoggerModule,
	],
})
export class AdminApiServerTestModule {}
