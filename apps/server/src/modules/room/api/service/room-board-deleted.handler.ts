import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomBoardDeletedEvent } from '@modules/board/domain/events/room-board-deleted.event';
import { RoomContentService } from '../../domain/service/room-content.service';

@Injectable()
@EventsHandler(RoomBoardDeletedEvent)
export class RoomBoardDeletedHandler implements IEventHandler<RoomBoardDeletedEvent> {
	constructor(private readonly roomContentService: RoomContentService) {}

	public async handle(event: RoomBoardDeletedEvent): Promise<void> {
		const contentExists = await this.roomContentService.contentExists(event.roomId);
		if (contentExists) {
			await this.roomContentService.removeBoard(event.roomId, event.boardId);
		}
	}
}
