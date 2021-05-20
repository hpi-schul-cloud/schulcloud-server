import { Module, NotFoundException } from '@nestjs/common';
import { AuthModule } from './modules/authentication/auth.module';
import { NewsModule } from './modules/news/news.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { UsersModule } from './modules/user/users.module';
import { DB_URL } from './config';
import { TaskModule } from './modules/task/task.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { News, SchoolInfo, UserInfo } from './modules/news/entity';
import { Task, Lesson, Course, Submission } from './modules/task/entity';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';

@Module({
	imports: [
		AuthModule,
		UsersModule,
		NewsModule,
		TaskModule,
		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			entities: [News, SchoolInfo, UserInfo, Task, Lesson, Course, Submission],
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
	],
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
