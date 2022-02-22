import { DynamicModule, Module} from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MailModule } from '@shared/infra/mail';
import { RocketChatModule } from '@src/modules/rocketchat';
import { LearnroomModule } from '@src/modules/learnroom';
import { CoreModule } from '@src/core';
import { TaskModule } from '@src/modules/task';
import { UserModule } from '@src/modules/user';
import { NewsModule } from '@src/modules/news';
import { FilesModule } from '@src/modules/files';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { AuthModule } from './modules/authentication/auth.module';
import { ServerController } from './server.controller';
import { ImportUserModule } from './modules/user-import/user-import.module';
import { OauthModule } from './modules/oauth';
import {CommonModule, defaultMikroOrmOptions} from "@src/common.module";

const serverModules = [
	CoreModule,
	AuthModule,
	OauthModule,
	TaskModule,
	NewsModule,
	UserModule,
	ImportUserModule,
	LearnroomModule,
	MailModule.forRoot({
		exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
		routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
	}),
	FilesModule,
	RocketChatModule.forRoot({
		uri: Configuration.get('ROCKET_CHAT_URI') as string,
		adminId: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
		adminToken: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
		adminUser: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
		adminPassword: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
	}),
];


/**
 * Server Module used for production
 */
@Module({
	imports: [
		CommonModule,
		...serverModules,
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
	imports: [...serverModules, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
	controllers: [ServerController],
})
export class ServerTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: ServerTestModule,
			imports: [...serverModules, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
			controllers: [ServerController],
		};
	}
}
