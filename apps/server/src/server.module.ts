import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
	imports: [AuthModule],
	controllers: [ServerController],
	providers: [ServerService],
})
export class ServerModule {}
