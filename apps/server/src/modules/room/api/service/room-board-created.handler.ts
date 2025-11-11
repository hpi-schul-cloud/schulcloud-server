import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomBoardCreatedEvent } from '@modules/board/domain/events/room-board-created.event';
import { RoomBoardService } from './room-board.service';

@Injectable()
@EventsHandler(RoomBoardCreatedEvent)
export class RoomBoardCreatedHandler implements IEventHandler<RoomBoardCreatedEvent> {
	constructor(private readonly roomBoardService: RoomBoardService, private readonly orm: MikroORM) {}

	@UseRequestContext()
	public async handle(event: RoomBoardCreatedEvent): Promise<void> {
		await this.roomBoardService.addBoardToRoom(event.roomId, event.boardId);
	}
}
