import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomContentService } from './room-content.service';
import { RoomDeletedEvent } from '../events/room-deleted.event';

@Injectable()
@EventsHandler(RoomDeletedEvent)
export class RoomContentCleanupHandler implements IEventHandler<RoomDeletedEvent> {
	constructor(private readonly roomContentService: RoomContentService) {}

	public async handle(event: RoomDeletedEvent): Promise<void> {
		await this.roomContentService.deleteContent(event.id);
	}
}
