import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/authentication/auth.module';
import { NewsModule } from './modules/news/news.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { UsersModule } from './modules/user/users.module';

@Module({
	imports: [AuthModule, UsersModule, NewsModule, MongooseModule.forRoot('mongodb://localhost:27017/schulcloud')], // TODO use db connection as defined for feathers
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
