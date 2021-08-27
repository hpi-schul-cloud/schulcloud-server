import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthModule } from './modules/authentication/auth.module';
import { ServerController } from './server.controller';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from './config';

import { CoreModule } from './core/core.module';
import { TaskModule } from './modules/task/task.module';
import { UserModule } from './modules/user/user.module';
import { NewsModule } from './modules/news/news.module';
import { MailModule } from './modules/mail/mail.module';
import { LearnroomModule } from './modules/learnroom/learnroom.module';

import {
	CourseNews,
	News,
	SchoolInfo,
	SchoolNews,
	TeamNews,
	UserInfo,
	CourseInfo,
	TeamInfo,
} from './modules/news/entity';

import { Task, LessonTaskInfo, Submission, FileTaskInfo, UserTaskInfo, CourseGroupInfo } from './modules/task/entity';

import { User, Role, Account } from './modules/user/entity';

import { Course, Coursegroup } from './modules/learnroom/entity';

const courseEntities = [CourseNews, News, SchoolInfo, SchoolNews, TeamNews, UserInfo, CourseInfo, TeamInfo];
const taskEntities = [Task, LessonTaskInfo, Submission, FileTaskInfo, UserTaskInfo, CourseGroupInfo];
const userEntities = [User, Role, Account];
const learnroomEntities = [Course, Coursegroup];

@Module({
	imports: [
		AuthModule,
		TaskModule,
		NewsModule,
		UserModule,
		MailModule.forRoot({
			uri: Configuration.get('RABBITMQ_URI') as string,
			exchange: Configuration.get('MAIL_SEND_EXCHANGE') as string,
			routingKey: Configuration.get('MAIL_SEND_ROUTING_KEY') as string,
		}),
		LearnroomModule,

		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...courseEntities, ...taskEntities, ...userEntities, ...learnroomEntities],
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
			debug: true,
		}),
		CoreModule,
	],
	controllers: [ServerController],
})
export class ServerModule {}
