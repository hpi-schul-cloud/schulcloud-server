import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';

@Module({
	imports: [AuthModule, UsersModule],
	controllers: [ServerController, UsersController],
	providers: [ServerService],
})
export class ServerModule {}
