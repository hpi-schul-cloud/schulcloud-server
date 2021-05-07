import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/authentication/auth.module';
import { NewsModule } from './modules/news/news.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { UsersModule } from './modules/user/users.module';
import { DB_URL } from './config';
import { TaskModule } from './modules/task/task.module';

@Module({
	imports: [AuthModule, UsersModule, NewsModule, TaskModule, MongooseModule.forRoot(DB_URL)],
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
