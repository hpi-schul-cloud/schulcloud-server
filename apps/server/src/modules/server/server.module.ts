import { Configuration } from '@hpi-schul-cloud/commons';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { MailModule } from '@infra/mail';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { SchulconnexClientModule } from '@infra/schulconnex-client';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { AccountApiModule } from '@modules/account/account-api.module';
import { AuthenticationApiModule } from '@modules/authentication/authentication-api.module';
import { BoardApiModule } from '@modules/board/board-api.module';
import { MediaBoardApiModule } from '@modules/board/media-board-api.module';
import { CollaborativeStorageModule } from '@modules/collaborative-storage';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { GroupApiModule } from '@modules/group/group-api.module';
import { LearnroomApiModule } from '@modules/learnroom/learnroom-api.module';
import { LegacySchoolApiModule } from '@modules/legacy-school/legacy-school.api-module';
import { LessonApiModule } from '@modules/lesson/lesson-api.module';
import { MeApiModule } from '@modules/me/me-api.module';
import { MetaTagExtractorApiModule, MetaTagExtractorModule } from '@modules/meta-tag-extractor';
import { NewsModule } from '@modules/news';
import { OauthProviderApiModule } from '@modules/oauth-provider';
import { OauthApiModule } from '@modules/oauth/oauth-api.module';
import { PseudonymApiModule } from '@modules/pseudonym/pseudonym-api.module';
import { RocketChatModule } from '@modules/rocketchat';
import { SchoolApiModule } from '@modules/school/school-api.module';
import { SharingApiModule } from '@modules/sharing/sharing.module';
import { SystemApiModule } from '@modules/system/system-api.module';
import { TaskApiModule } from '@modules/task/task-api.module';
import { TeamsApiModule } from '@modules/teams/teams-api.module';
import { ToolApiModule } from '@modules/tool/tool-api.module';
import { ImportUserModule, UserImportConfigModule } from '@modules/user-import';
import { UserLoginMigrationApiModule } from '@modules/user-login-migration/user-login-migration-api.module';
import { UsersAdminApiModule } from '@modules/user/legacy/users-admin-api.module';
import { UserApiModule } from '@modules/user/user-api.module';
import { VideoConferenceApiModule } from '@modules/video-conference/video-conference-api.module';
import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { ServerConfigController, ServerController, ServerUc } from './api';
import { SERVER_CONFIG_TOKEN, serverConfig } from './server.config';
import { EtherpadClientModule } from '@src/infra/etherpadClient';

const serverModules = [
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	CoreModule,
	AuthenticationApiModule,
	AccountApiModule,
	CollaborativeStorageModule,
	OauthApiModule,
	MetaTagExtractorModule,
	TaskApiModule,
	LessonApiModule,
	NewsModule,
	UserApiModule,
	UsersAdminApiModule,
	SchulconnexClientModule.register({
		apiUrl: Configuration.get('SCHULCONNEX_CLIENT__API_URL') as string,
		tokenEndpoint: Configuration.get('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT') as string,
		clientId: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_ID') as string,
		clientSecret: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_SECRET') as string,
		personenInfoTimeoutInMs: Configuration.get('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS') as number,
	}),
	EtherpadClientModule.register({
		apiUri: Configuration.get('ETHERPAD_URI') as string,
		apiKey: Configuration.get('ETHERPAD_API_KEY') as string,
		cookieExpirationInSeconds: Configuration.get('ETHERPAD_COOKIE__EXPIRES_SECONDS') as number,
		cookieReleaseThreshold: Configuration.get('ETHERPAD_COOKIE_RELEASE_THRESHOLD') as number,
	}),
	ImportUserModule,
	UserImportConfigModule,
	LearnroomApiModule,
	FilesStorageClientModule,
	SystemApiModule,
	MailModule.forRoot({
		exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
		routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
	}),
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
	TeamsApiModule,
	MetaTagExtractorApiModule,
	PseudonymApiModule,
	SchoolApiModule,
	LegacySchoolApiModule,
	MeApiModule,
	MediaBoardApiModule,
];

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

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
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,

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
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }),
		RabbitMQWrapperTestModule,
		LoggerModule,
	],
	providers,
	controllers,
})
export class ServerTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: ServerTestModule,
			imports: [
				...serverModules,
				MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options }),
				RabbitMQWrapperTestModule,
			],
			providers,
			controllers,
		};
	}
}
