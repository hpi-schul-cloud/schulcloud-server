import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoomService } from './domain/service';
import { RoomRepo } from './repo';

@Module({
	imports: [CqrsModule],
	providers: [RoomRepo, RoomService],
	exports: [RoomService],
})
export class RoomModule {}
