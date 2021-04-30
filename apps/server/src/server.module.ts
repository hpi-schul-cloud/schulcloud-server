import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/authentication/auth.module';
import { NewsModule } from './features/news/news.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { UsersModule } from './features/users/users.module';

@Module({
	imports: [AuthModule, UsersModule, NewsModule, MongooseModule.forRoot('mongodb://localhost:27017/schulcloud')],
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
