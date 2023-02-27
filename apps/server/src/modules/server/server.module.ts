import { Configuration } from '@hpi-schul-cloud/commons';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MailModule } from '@shared/infra/mail';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { CollaborativeStorageModule } from '@src/modules/collaborative-storage';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { LearnroomModule } from '@src/modules/learnroom';
import { LessonApiModule } from '@src/modules/lesson';
import { NewsModule } from '@src/modules/news';
import { OauthProviderModule } from '@src/modules/oauth-provider';
import { OauthApiModule } from '@src/modules/oauth/oauth-api.module';
import { ProvisioningModule } from '@src/modules/provisioning';
import { RocketChatModule } from '@src/modules/rocketchat';
import { RoleModule } from '@src/modules/role/role.module';
import { SchoolApiModule } from '@src/modules/school/school-api.module';
import { SharingApiModule } from '@src/modules/sharing/sharing.module';
import { SystemModule } from '@src/modules/system';
import { TaskModule } from '@src/modules/task';
import { TaskCardModule } from '@src/modules/task-card';
import { ToolApiModule } from '@src/modules/tool/tool-api.module';
import { UserModule } from '@src/modules/user';
import { ImportUserModule } from '@src/modules/user-import';
import { UserLoginMigrationApiModule } from '@src/modules/user-login-migration';
import { VideoConferenceModule } from '@src/modules/video-conference';
import { ServerController } from './controller/server.controller';
import { serverConfig } from './server.config';

const serverModules = [
	ConfigModule.forRoot({
		isGlobal: true,
		validationOptions: { infer: true },
		// hacky solution: the server config is loaded in the validate step.
		// reasoning: nest's ConfigService has fixed priority of configs.
		// 1. validated configs, 2. default passed in configService.get(key, default) 3. process.env 4. custom configs
		// in process env everything is a string. So a feature flag will be the string 'false' and therefore truthy
		// So we want custom configs to overwrite process.env. Thus we make them validated
		validate: serverConfig,
	}),
	CoreModule,
	AuthenticationApiModule,
	CollaborativeStorageModule,
	OauthApiModule,
	TaskModule,
	TaskCardModule,
	LessonApiModule,
	NewsModule,
	UserModule,
	ImportUserModule,
	LearnroomModule,
	FilesStorageClientModule,
	SystemModule,
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
	ProvisioningModule,
	RoleModule,
	VideoConferenceModule,
	OauthProviderModule,
	SharingApiModule,
	ToolApiModule,
	UserLoginMigrationApiModule,
];

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
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
	],
	controllers: [ServerController],
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
	],
	controllers: [ServerController],
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
			controllers: [ServerController],
		};
	}
}
