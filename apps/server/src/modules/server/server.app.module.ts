import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AccountApiModule } from '@modules/account/account-api.module';
import { AlertModule } from '@modules/alert/alert.module';
import { AuthenticationApiModule } from '@modules/authentication/authentication-api.module';
import { AuthorizationReferenceApiModule } from '@modules/authorization-reference/authorization-reference.api.module';
import { AuthorizationRulesModule } from '@modules/authorization-rules';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from '@modules/board-context';
import { BoardApiModule } from '@modules/board/board-api.module';
import { MediaBoardApiModule } from '@modules/board/media-board-api.module';
import { MoinSchuleClassModule } from '@modules/class-moin-schule/moin-schule-class.module';
import { CollaborativeStorageModule } from '@modules/collaborative-storage';
import { CollaborativeTextEditorApiModule } from '@modules/collaborative-text-editor/collaborative-text-editor-api.module';
import { CourseApiModule } from '@modules/course/course-api.module';
import { DeletionPublicApiModule } from '@modules/deletion/deletion-public-api.module';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { GroupApiModule } from '@modules/group/group-api.module';
import { HelpdeskApiModule } from '@modules/helpdesk';
import { LearnroomApiModule } from '@modules/learnroom/learnroom-api.module';
import { LegacySchoolApiModule } from '@modules/legacy-school/legacy-school.api-module';
import { LessonApiModule } from '@modules/lesson/lesson-api.module';
import { MeApiModule } from '@modules/me/me-api.module';
import { MediumMetadataApiModule } from '@modules/medium-metadata';
import { MetaTagExtractorApiModule, MetaTagExtractorModule } from '@modules/meta-tag-extractor';
import { NewsModule } from '@modules/news';
import { OauthProviderApiModule } from '@modules/oauth-provider/oauth-provider-api.module';
import { OAuthApiModule } from '@modules/oauth/oauth-api.module';
import { PseudonymApiModule } from '@modules/pseudonym/pseudonym-api.module';
import { RegistrationModule } from '@modules/registration';
import { RegistrationApiModule } from '@modules/registration/registration-api.module';
import { RocketChatModule } from '@modules/rocketchat';
import { RoomApiModule } from '@modules/room/room-api.module';
import { RosterModule } from '@modules/roster/roster.module';
import { RuntimeConfigApiModule, ServerRuntimeConfigModule } from '@modules/runtime-config-api';
import { SchoolApiModule } from '@modules/school/school-api.module';
import { SharingApiModule } from '@modules/sharing/sharing-api.module';
import { ShdApiModule } from '@modules/shd/shd.api.module';
import { SystemApiModule } from '@modules/system/system-api.module';
import { TaskApiModule } from '@modules/task/task-api.module';
import { TeamApiModule } from '@modules/team/team-api.module';
import { ToolApiModule } from '@modules/tool/tool-api.module';
import { ImportUserModule } from '@modules/user-import';
import { UserLicenseModule } from '@modules/user-license';
import { UserLoginMigrationApiModule } from '@modules/user-login-migration/user-login-migration-api.module';
import { UsersAdminApiModule } from '@modules/user/legacy/users-admin-api.module';
import { UserApiModule } from '@modules/user/user-api.module';
import { VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig } from '@modules/video-conference';
import { VideoConferenceApiModule } from '@modules/video-conference/video-conference-api.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MediaSourceApiModule } from '../media-source/media-source-api.module';
import { SchoolLicenseApiModule } from '../school-license/school-license-api.module';
import { ServerMailModule } from '../serverDynamicModuleWrappers/server-mail.module';
import { ServerConfigController, ServerController, ServerUc } from './api';
import { SERVER_CONFIG_TOKEN, serverConfig } from './server.config';
import { ENTITIES, TEST_ENTITIES } from './server.entity.imports';
import { MongoDriver } from '@mikro-orm/mongodb';

const serverModules = [
	HelpdeskApiModule,
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	ConfigurationModule.register(VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig),
	ConfigurationModule.register(BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig),
	ServerRuntimeConfigModule,
	RuntimeConfigApiModule,
	CoreModule,
	CourseApiModule,
	AuthenticationApiModule,
	AuthGuardModule.register([AuthGuardOptions.JWT]),
	AuthorizationReferenceApiModule,
	AuthorizationRulesModule,
	AccountApiModule,
	CollaborativeStorageModule,
	MetaTagExtractorModule,
	TaskApiModule,
	LessonApiModule,
	NewsModule,
	UserApiModule,
	UsersAdminApiModule,
	SchulconnexClientModule.registerAsync(),
	ImportUserModule,
	LearnroomApiModule,
	FilesStorageClientModule,
	SystemApiModule,
	ServerMailModule,
	RocketChatModule.forRoot({
		uri: Configuration.get('ROCKET_CHAT_URI') as string,
		adminId: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
		adminToken: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
		adminUser: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
		adminPassword: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
		rocketchatClientTimeoutInMs: Configuration.get('ROCKET_CHAT_CLIENT_TIMEOUT_MS') as number,
	}),
	VideoConferenceApiModule,
	OauthProviderApiModule,
	SharingApiModule,
	ToolApiModule,
	UserLoginMigrationApiModule,
	BoardApiModule,
	GroupApiModule,
	TeamApiModule,
	MetaTagExtractorApiModule,
	PseudonymApiModule,
	SchoolApiModule,
	LegacySchoolApiModule,
	MeApiModule,
	MediaBoardApiModule,
	MediaSourceApiModule,
	MediumMetadataApiModule,
	CollaborativeTextEditorApiModule,
	AlertModule,
	UserLicenseModule,
	SchoolLicenseApiModule,
	RegistrationModule,
	RegistrationApiModule,
	RoomApiModule,
	RosterModule,
	ShdApiModule,
	OAuthApiModule,
	MoinSchuleClassModule,
	DeletionPublicApiModule,
];

const providers = [ServerUc, { provide: SERVER_CONFIG_TOKEN, useValue: serverConfig() }];
const controllers = [ServerController, ServerConfigController];

/**
 * Server Module used for production
 */
@Module({
	imports: [
		RabbitMQWrapperModule,
		...serverModules,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			driver: MongoDriver,
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ENTITIES,

			// debug: true, // use it for locally debugging of queries
		}),
		LoggerModule,
	],
	providers,
	controllers,
})
export class ServerModule {}

/**
 * Server module used for testing.
 * Should have same modules than the @ServerModule while infrastucture Modules can be different.
 * Customizations:
 * - In Memory Database instead of external connection
 * // TODO add custom mail, rocketchat, and rabbitmq modules
 * // TODO use instead of ServerModule when NODE_ENV=test
 */
@Module({
	imports: [
		...serverModules,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, entities: TEST_ENTITIES }),
		RabbitMQWrapperTestModule,
		LoggerModule,
	],
	providers,
	controllers,
})
export class ServerTestModule {}
