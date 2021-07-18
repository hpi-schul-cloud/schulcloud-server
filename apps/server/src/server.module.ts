import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { AuthModule } from './modules/authentication/auth.module';
import { ServerController } from './server.controller';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from './config';

import { CoreModule } from './core/core.module';
import { TaskModule } from './modules/task/task.module';
import { UserModule } from './modules/user/user.module';

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
import { Task, LessonTaskInfo, Submission, FileTaskInfo, UserTaskInfo } from './modules/task/entity';
import { User, Role, Account, GroupEntity } from './modules/user/entity';

const courseEntities = [CourseNews, News, SchoolInfo, SchoolNews, TeamNews, UserInfo, CourseInfo, TeamInfo];
const taskEntities = [Task, LessonTaskInfo, Submission, FileTaskInfo, UserTaskInfo];
const userEntities = [User, Role, Account, GroupEntity];

@Module({
	imports: [
		AuthModule,
		TaskModule,
		UserModule,
		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...courseEntities, ...taskEntities, ...userEntities],
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
