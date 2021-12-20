import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ALL_ENTITIES } from '@shared/domain';
import { MailModule } from '@shared/infra/mail';
import { RocketChatModule } from '@src/modules/rocketchat';
import { LearnroomModule } from '@src/modules/learnroom';
import { CoreModule } from '@src/core';
import { TaskModule } from '@src/modules/task';
import { UserModule } from '@src/modules/user';
import { NewsModule } from '@src/modules/news';
import { FilesModule } from '@src/modules/files';
import { AuthModule } from './modules/authentication/auth.module';
import { ServerController } from './server.controller';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from './config';
import { ImportUserModule } from './modules/user-import/user-import.module';

@Module({
	imports: [
		AuthModule,
		TaskModule,
		NewsModule,
		UserModule,
		ImportUserModule,
		LearnroomModule,
		MailModule.forRoot({
			uri: Configuration.get('RABBITMQ_URI') as string,
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

		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
			// ToDo: comment this line again
			debug: true, // use it for locally debugging of querys
		}),
		CoreModule,
	],
	controllers: [ServerController],
})
export class ServerModule {}
