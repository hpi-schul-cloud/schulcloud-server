import { Module } from '@nestjs/common';
import { RoomService } from './domain/service';
import { RoomRepo } from './repo';

@Module({
	imports: [],
	providers: [RoomRepo, RoomService],
	exports: [RoomService],
})
export class RoomModule {}
