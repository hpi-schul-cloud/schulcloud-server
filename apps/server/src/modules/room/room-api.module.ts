import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RoomController, RoomUc } from './api';
import { RoomModule } from './room.module';

@Module({
	imports: [RoomModule, AuthorizationModule, LoggerModule],
	controllers: [RoomController],
	providers: [RoomUc],
})
export class RoomApiModule {}
