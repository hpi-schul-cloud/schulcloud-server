import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { AuthModule } from './modules/authentication/auth.module';
import { NewsModule } from './modules/news/news.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { DB_URL } from './config';
import { TaskModule } from './modules/task/task.module';
import { CourseNews, News, SchoolInfo, SchoolNews, TeamNews, UserInfo } from './modules/news/entity';
import { Task, Lesson, Course, Submission } from './modules/task/entity';
import { CoreModule } from './core/core.module';
import { CourseInfo } from './modules/news/entity/course-info.entity';
import { TeamInfo } from './modules/news/entity/team-info.entity';

@Module({
	imports: [
		AuthModule,
		NewsModule,
		TaskModule,
		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			entities: [
				News,
				CourseNews,
				SchoolNews,
				TeamNews,
				CourseInfo,
				SchoolInfo,
				TeamInfo,
				UserInfo,
				Task,
				Lesson,
				Course,
				Submission,
			],
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
		CoreModule,
	],
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
