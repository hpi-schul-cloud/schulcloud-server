import { Configuration } from '@hpi-schul-cloud/commons';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, MiddlewareConsumer, Module, NestModule, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MailModule } from '@shared/infra/mail';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { RedisModule, REDIS_CLIENT } from '@shared/infra/redis';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { AccountApiModule } from '@src/modules/account/account-api.module';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { BoardApiModule } from '@src/modules/board/board-api.module';
import { CollaborativeStorageModule } from '@src/modules/collaborative-storage';
import { DemoApiModule } from '@src/modules/demo/demo-api.module';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { GroupApiModule } from '@src/modules/group/group-api.module';
import { LearnroomApiModule } from '@src/modules/learnroom/learnroom-api.module';
import { LessonApiModule } from '@src/modules/lesson/lesson-api.module';
import { NewsModule } from '@src/modules/news';
import { OauthProviderApiModule } from '@src/modules/oauth-provider';
import { OauthApiModule } from '@src/modules/oauth/oauth-api.module';
import { RocketChatModule } from '@src/modules/rocketchat';
import { SchoolApiModule } from '@src/modules/school/school-api.module';
import { SharingApiModule } from '@src/modules/sharing/sharing.module';
import { SystemApiModule } from '@src/modules/system/system-api.module';
import { TaskApiModule } from '@src/modules/task/task-api.module';
import { TeamsApiModule } from '@src/modules/teams/teams-api.module';
import { ToolApiModule } from '@src/modules/tool/tool-api.module';
import { ImportUserModule } from '@src/modules/user-import';
import { UserLoginMigrationApiModule } from '@src/modules/user-login-migration/user-login-migration-api.module';
import { UserApiModule } from '@src/modules/user/user-api.module';
import { VideoConferenceApiModule } from '@src/modules/video-conference/video-conference-api.module';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { RedisClient } from 'redis';
import { ServerController } from './controller/server.controller';
import { serverConfig } from './server.config';

const serverModules = [
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	CoreModule,
	AuthenticationApiModule,
	AccountApiModule,
	CollaborativeStorageModule,
	OauthApiModule,
	TaskApiModule,
	LessonApiModule,
	NewsModule,
	UserApiModule,
	ImportUserModule,
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
	}),
	SchoolApiModule,
	VideoConferenceApiModule,
	OauthProviderApiModule,
	SharingApiModule,
	ToolApiModule,
	UserLoginMigrationApiModule,
	BoardApiModule,
	DemoApiModule,
	GroupApiModule,
	TeamsApiModule,
];

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const setupSessions = (consumer: MiddlewareConsumer, redisClient: RedisClient | undefined, logger: LegacyLogger) => {
	const sessionDuration: number = Configuration.get('SESSION__EXPIRES_SECONDS') as number;

	let store: connectRedis.RedisStore | undefined;
	if (redisClient) {
		const RedisStore: connectRedis.RedisStore = connectRedis(session);
		store = new RedisStore({
			client: redisClient,
			ttl: sessionDuration,
		});
	} else {
		logger.warn(
			'The RedisStore for sessions is not setup, since the environment variable REDIS_URI is not defined. Sessions are using the build-in MemoryStore. This should not be used in production!'
		);
	}

	consumer
		.apply(
			session({
				store,
				secret: Configuration.get('SESSION__SECRET') as string,
				resave: false,
				saveUninitialized: false,
				name: Configuration.has('SESSION__NAME') ? (Configuration.get('SESSION__NAME') as string) : undefined,
				proxy: Configuration.has('SESSION__PROXY') ? (Configuration.get('SESSION__PROXY') as boolean) : undefined,
				cookie: {
					secure: Configuration.get('SESSION__SECURE') as boolean,
					sameSite: Configuration.get('SESSION__SAME_SITE') as boolean | 'lax' | 'strict' | 'none',
					httpOnly: Configuration.get('SESSION__HTTP_ONLY') as boolean,
					maxAge: sessionDuration * 1000,
				},
			})
		)
		.forRoutes('*');
};

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
		RedisModule,
	],
	controllers: [ServerController],
})
export class ServerModule implements NestModule {
	constructor(
		@Inject(REDIS_CLIENT) private readonly redisClient: RedisClient | undefined,
		private readonly logger: LegacyLogger
	) {
		logger.setContext(ServerModule.name);
	}

	configure(consumer: MiddlewareConsumer) {
		setupSessions(consumer, this.redisClient, this.logger);
	}
}

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
		RedisModule,
	],
	controllers: [ServerController],
})
export class ServerTestModule implements NestModule {
	constructor(
		@Inject(REDIS_CLIENT) private readonly redisClient: RedisClient | undefined,
		private readonly logger: LegacyLogger
	) {
		logger.setContext(ServerTestModule.name);
	}

	configure(consumer: MiddlewareConsumer) {
		setupSessions(consumer, undefined, this.logger);
	}

	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: ServerTestModule,
			imports: [
				...serverModules,
				MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options }),
				RabbitMQWrapperTestModule,
			],
			controllers: [ServerController],
		};
	}
}
