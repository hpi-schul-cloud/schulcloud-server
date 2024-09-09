import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RoomController } from './api/room.controller';
import { RoomModule } from './room.module';
import { RoomUc } from './api/room.uc';

@Module({
	imports: [RoomModule, AuthorizationModule, LoggerModule],
	controllers: [RoomController],
	providers: [RoomUc],
})
export class RoomApiModule {}
