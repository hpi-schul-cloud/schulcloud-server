import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { RoomArrangementService } from '@modules/room/domain';
import { RoomCreatedEvent } from '@modules/room/domain/events/room-created.event';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@Injectable()
@EventsHandler(RoomCreatedEvent)
export class RoomCreatedHandler implements IEventHandler<RoomCreatedEvent> {
	constructor(private readonly roomArrangementService: RoomArrangementService, private readonly orm: MikroORM) {}

	@UseRequestContext()
	public async handle(event: RoomCreatedEvent): Promise<void> {
		const { roomId } = event;
		const userIds = []; // TODO fetch all user IDs who should have the room added to their arrangements

		await this.roomArrangementService.addRoomToUserArrangements(userIds, roomId);
	}
}
