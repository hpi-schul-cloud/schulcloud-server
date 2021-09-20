import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Account, Course, CourseGroup, File, Lesson, Role, School, Submission, Task, Team, User } from '@shared/domain';
import { CourseNews, News, SchoolNews, TeamNews } from '@shared/domain/entity/news.entity';
import { AuthModule } from './modules/authentication/auth.module';
import { ServerController } from './server.controller';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from './config';

import { CoreModule } from './core/core.module';
import { TaskModule } from './modules/task/task.module';
import { UserModule } from './modules/user/user.module';
import { NewsModule } from './modules/news/news.module';
import { MailModule } from './modules/mail/mail.module';
import { LearnroomModule } from './modules/learnroom/learnroom.module';

@Module({
	imports: [
		AuthModule,
		TaskModule,
		NewsModule,
		UserModule,
		LearnroomModule,
		MailModule.forRoot({
			uri: Configuration.get('RABBITMQ_URI') as string,
			exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
			routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
		}),

		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [
				Account,
				Course,
				CourseGroup,
				File,
				Lesson,
				Role,
				School,
				Submission,
				Task,
				Team,
				User,
				CourseNews,
				News,
				SchoolNews,
				TeamNews,
			],
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
			// debug: true, // use it for locally debugging of querys
		}),
		CoreModule,
	],
	controllers: [ServerController],
})
export class ServerModule {}
