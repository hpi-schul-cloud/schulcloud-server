import { Configuration } from '@hpi-schul-cloud/commons';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MailModule } from '@shared/infra/mail';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { CoreModule } from '@src/core';
import { UserModule } from '@src/modules/user';
import { SchoolModule } from '@src/modules/school/school.module';
import { ProvisioningModule } from '@src/modules/provisioning';
import { RoleModule } from '@src/modules/role/role.module';
// todo: MUST BE CHECKED BEFORE MERGE
// import { FilesModule } from '@src/modules/files';
import {
	AuthModule,
	CollaborativeStorageModule,
	FilesStorageClientModule,
	ImportUserModule,
	LearnroomModule,
	NewsModule,
	OauthModule,
	OauthProviderModule,
	RocketChatModule,
	SystemModule,
	TaskModule,
	VideoConferenceModule,
} from '@src/modules';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from './config';
import serverConfig from './server.config';
import { ServerController } from './server.controller';

const serverModules = [
	ConfigModule.forRoot({
		isGlobal: true,
		validationOptions: { infer: true },
		load: [serverConfig],
	}),
	CoreModule,
	AuthModule,
	CollaborativeStorageModule,
	OauthModule,
	TaskModule,
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
	SchoolModule,
	ProvisioningModule,
	RoleModule,
	VideoConferenceModule,
	OauthProviderModule,
];

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
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
