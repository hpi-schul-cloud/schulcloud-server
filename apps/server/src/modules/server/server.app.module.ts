import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from '@infra/schulconnex-client';
import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { AccountApiModule } from '@modules/account/account-api.module';
import { ALERT_PUBLIC_API_CONFIG, AlertPublicApiConfig } from '@modules/alert';
import { AlertModule } from '@modules/alert/alert.module';
import { AuthenticationApiModule } from '@modules/authentication/authentication-api.module';
import { AuthorizationReferenceApiModule } from '@modules/authorization-reference/authorization-reference.api.module';
import { AuthorizationRulesModule } from '@modules/authorization-rules';
import { BOARD_PUBLIC_API_CONFIG_TOKEN, BoardPublicApiConfig } from '@modules/board';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from '@modules/board-context';
import { BoardApiModule } from '@modules/board/board-api.module';
import { MediaBoardApiModule } from '@modules/board/media-board-api.module';
import { MoinSchuleClassModule } from '@modules/class-moin-schule/moin-schule-class.module';
import { CollaborativeStorageModule } from '@modules/collaborative-storage';
import { CollaborativeTextEditorApiModule } from '@modules/collaborative-text-editor/collaborative-text-editor-api.module';
import { COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig } from '@modules/common-cartridge';
import { CourseApiModule } from '@modules/course/course-api.module';
import { DeletionPublicApiModule } from '@modules/deletion/deletion-public-api.module';
import {
	FILES_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientConfig,
	FilesStorageClientModule,
} from '@modules/files-storage-client';
import { FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig } from '@modules/fwu-learning-contents';
import { GroupApiModule } from '@modules/group/group-api.module';
import { HelpdeskApiModule } from '@modules/helpdesk';
import { LEARNROOM_PUBLIC_API_CONFIG_TOKEN, LearnroomPublicApiConfig } from '@modules/learnroom';
import { LearnroomApiModule } from '@modules/learnroom/learnroom-api.module';
import { LegacySchoolApiModule } from '@modules/legacy-school/legacy-school.api-module';
import { LessonApiModule } from '@modules/lesson/lesson-api.module';
import { MeApiModule } from '@modules/me/me-api.module';
import { MediumMetadataApiModule } from '@modules/medium-metadata';
import { MetaTagExtractorApiModule, MetaTagExtractorModule } from '@modules/meta-tag-extractor';
import { NewsModule } from '@modules/news';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig } from '@modules/oauth';
import { OauthProviderApiModule } from '@modules/oauth-provider/oauth-provider-api.module';
import { OAuthApiModule } from '@modules/oauth/oauth-api.module';
import { PROVISIONING_PUBLIC_API_CONFIG, ProvisioningPublicApiConfig } from '@modules/provisioning';
import { PseudonymApiModule } from '@modules/pseudonym/pseudonym-api.module';
import {
	REGISTRATION_PUBLIC_API_CONFIG_TOKEN,
	RegistrationApiModule,
	RegistrationModule,
	RegistrationPublicApiConfig,
} from '@modules/registration';
import { ROCKET_CHAT_API_PUBLIC_CONFIG_TOKEN, RocketChatModule, RocketChatPublicApiConfig } from '@modules/rocketchat';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room';
import { RoomApiModule } from '@modules/room/room-api.module';
import { ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig } from '@modules/roster';
import { RosterModule } from '@modules/roster/roster.module';
import { RuntimeConfigApiModule, ServerRuntimeConfigModule } from '@modules/runtime-config-api';
import { SchoolApiModule } from '@modules/school/school-api.module';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from '@modules/sharing';
import { SharingApiModule } from '@modules/sharing/sharing-api.module';
import { ShdApiModule } from '@modules/shd/shd.api.module';
import { SystemApiModule } from '@modules/system/system-api.module';
import { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from '@modules/task';
import { TaskApiModule } from '@modules/task/task-api.module';
import { TeamApiModule } from '@modules/team/team-api.module';
import { TOOL_PUBLIC_API_CONFIG_TOKEN, ToolPublicApiConfig } from '@modules/tool';
import { ToolApiModule } from '@modules/tool/tool-api.module';
import { USER_PUBLIC_API_CONFIG_TOKEN, UserPublicApiConfig } from '@modules/user';
import { ImportUserModule, USER_IMPORT_PUBLIC_API_CONFIG_TOKEN, UserImportPublicApiConfig } from '@modules/user-import';
import { UserLicenseModule } from '@modules/user-license';
import {
	USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN,
	UserLoginMigrationPublicApiConfig,
} from '@modules/user-login-migration';
import { UserLoginMigrationApiModule } from '@modules/user-login-migration/user-login-migration-api.module';
import { UsersAdminApiModule } from '@modules/user/legacy/users-admin-api.module';
import { UserApiModule } from '@modules/user/user-api.module';
import { VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig } from '@modules/video-conference';
import { VideoConferenceApiModule } from '@modules/video-conference/video-conference-api.module';
import { Module } from '@nestjs/common';
import { findOneOrFailHandler } from '@shared/common/database-error.handler';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MediaSourceApiModule } from '../media-source/media-source-api.module';
import { SchoolLicenseApiModule } from '../school-license/school-license-api.module';
import { ServerMailModule } from '../serverDynamicModuleWrappers/server-mail.module';
import { ServerConfigController, ServerController, ServerUc } from './api';
import { SERVER_PUBLIC_API_CONFIG_TOKEN, ServerPublicApiConfig } from './server.config';
import { ENTITIES, TEST_ENTITIES } from './server.entity.imports';

const serverModules = [
	HelpdeskApiModule,
	ConfigurationModule.register(SERVER_PUBLIC_API_CONFIG_TOKEN, ServerPublicApiConfig),
	ConfigurationModule.register(VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig),
	ConfigurationModule.register(BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig),
	ConfigurationModule.register(ALERT_PUBLIC_API_CONFIG, AlertPublicApiConfig),
	ConfigurationModule.register(OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig),
	ConfigurationModule.register(BOARD_PUBLIC_API_CONFIG_TOKEN, BoardPublicApiConfig),
	ConfigurationModule.register(PROVISIONING_PUBLIC_API_CONFIG, ProvisioningPublicApiConfig),
	ConfigurationModule.register(REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig),
	ConfigurationModule.register(ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig),
	ConfigurationModule.register(ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig),
	ConfigurationModule.register(SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig),
	ConfigurationModule.register(COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig),
	ConfigurationModule.register(TOOL_PUBLIC_API_CONFIG_TOKEN, ToolPublicApiConfig),
	ConfigurationModule.register(TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig),
	ConfigurationModule.register(LEARNROOM_PUBLIC_API_CONFIG_TOKEN, LearnroomPublicApiConfig),
	ConfigurationModule.register(USER_PUBLIC_API_CONFIG_TOKEN, UserPublicApiConfig),
	ConfigurationModule.register(USER_IMPORT_PUBLIC_API_CONFIG_TOKEN, UserImportPublicApiConfig),
	ConfigurationModule.register(USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN, UserLoginMigrationPublicApiConfig),
	ConfigurationModule.register(FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig),
	ConfigurationModule.register(ROCKET_CHAT_API_PUBLIC_CONFIG_TOKEN, RocketChatPublicApiConfig),
	ServerRuntimeConfigModule,
	RuntimeConfigApiModule,
	CoreModule,
	CourseApiModule,
	AuthenticationApiModule,
	AuthGuardModule.register([
		{
			option: AuthGuardOptions.JWT,
			configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
			configConstructor: JwtAuthGuardConfig,
		},
	]),
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
	SchulconnexClientModule.register(SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig),
	ImportUserModule,
	LearnroomApiModule,
	FilesStorageClientModule.register({
		exchangeConfigConstructor: FilesStorageClientConfig,
		exchangeConfigInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
		configInjectionToken: RABBITMQ_CONFIG_TOKEN,
		configConstructor: RabbitMQConfig,
	}),
	SystemApiModule,
	ServerMailModule,
	RocketChatModule,
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

const providers = [ServerUc];
const controllers = [ServerController, ServerConfigController];

/**
 * Server Module used for production
 */
@Module({
	imports: [
		...serverModules,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
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
		MongoMemoryDatabaseModule.forRoot({ findOneOrFailHandler, entities: TEST_ENTITIES }),
		LoggerModule,
	],
	providers,
	controllers,
})
export class ServerTestModule {}
