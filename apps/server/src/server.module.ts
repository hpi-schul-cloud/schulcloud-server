import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { UsersModule } from './users/users.module';

@Module({
	imports: [AuthModule, UsersModule, NewsModule],
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
