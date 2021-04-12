import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
  imports: [],
  controllers: [ServerController],
  providers: [ServerService],
})
export class ServerModule {}
