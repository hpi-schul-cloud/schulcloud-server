import { Module, NotFoundException } from '@nestjs/common';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '@src/config';
import { AuthModule } from './modules/authentication/auth.module';
import { NewsModule } from './modules/news/news.module';
import { MailModule } from './modules/mail/mail.module';
import { ServerController } from './server.controller';
import { TaskModule } from './modules/task/task.module';
import { CourseNews, News, SchoolInfo, SchoolNews, TeamNews, UserInfo } from './modules/news/entity';
import { Task, Submission, Lesson, Course } from './modules/task/entity';
import { CoreModule } from './core/core.module';
import { CourseInfo } from './modules/news/entity/course-info.entity';
import { TeamInfo } from './modules/news/entity/team-info.entity';

@Module({
	imports: [
		AuthModule,
		TaskModule,
		NewsModule,
		MailModule,
		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [
				News,
				CourseInfo,
				CourseNews,
				SchoolNews,
				TeamNews,
				SchoolInfo,
				TeamInfo,
				UserInfo,
				Task,
				Lesson,
				Course,
				Submission,
			],
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
		CoreModule,
	],
	controllers: [ServerController],
})
export class ServerModule {}
