import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomBoardDeletedEvent } from '@modules/board/domain/events/room-board-deleted.event';
import { RoomBoardService } from './room-board.service';

@Injectable()
@EventsHandler(RoomBoardDeletedEvent)
export class RoomBoardDeletedHandler implements IEventHandler<RoomBoardDeletedEvent> {
	constructor(private readonly roomBoardService: RoomBoardService, private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(event: RoomBoardDeletedEvent): Promise<void> {
		await this.roomBoardService.removeBoardFromRoom(event.roomId, event.boardId);
	}
}
