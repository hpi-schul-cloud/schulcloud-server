import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoomRepo } from './repo';
import { RoomService } from './domain/service';

@Module({
	imports: [CqrsModule],
	providers: [RoomRepo, RoomService],
	exports: [RoomService],
})
export class RoomModule {}
