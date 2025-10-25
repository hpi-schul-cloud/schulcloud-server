import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomBoardCreatedEvent } from '@modules/board/domain/events/room-board-created.event';
import { RoomContentService } from '../../domain/service/room-content.service';

@Injectable()
@EventsHandler(RoomBoardCreatedEvent)
export class RoomBoardCreatedHandler implements IEventHandler<RoomBoardCreatedEvent> {
	constructor(private readonly roomContentService: RoomContentService, private readonly orm: MikroORM) {}

	@UseRequestContext()
	public async handle(event: RoomBoardCreatedEvent): Promise<void> {
		const contentExists = await this.roomContentService.contentExists(event.roomId);
		if (contentExists) {
			await this.roomContentService.addBoard(event.roomId, event.boardId);
		} else {
			await this.roomContentService.createContent(event.roomId, [event.boardId]);
		}
	}
}
