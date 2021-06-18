import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { AuthModule } from './modules/authentication/auth.module';
import { ServerController } from './server.controller';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from './config';
import { TaskModule } from './modules/task/task.module';
import { CourseNews, News, SchoolInfo, SchoolNews, TeamNews, UserInfo, CourseInfo as CourseNewsInfo, TeamInfo } from './modules/news/entity';
import { Task, LessonInfo as LessonTaskInfo, CourseInfo as CourseTaskInfo, Submission, FileInfo as FileTaskInfo } from './modules/task/entity';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		AuthModule,
		TaskModule,
		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [
				News,
				CourseNewsInfo,
				CourseNews,
				SchoolNews,
				TeamNews,
				SchoolInfo,
				TeamInfo,
				UserInfo,
				Task,
				LessonTaskInfo,
				CourseTaskInfo,
				FileTaskInfo,
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
