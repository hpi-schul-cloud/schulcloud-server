import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RoomBoardService } from './room-board.service';
import { RoomDeletedEvent } from '@modules/room/domain/events/room-deleted.event';
import { RoomMembershipService } from '@modules/room-membership';
import { BoardExternalReferenceType, ColumnBoardService } from '@modules/board';

@Injectable()
@EventsHandler(RoomDeletedEvent)
export class RoomDeletedHandler implements IEventHandler<RoomDeletedEvent> {
	constructor(
		private readonly roomBoardService: RoomBoardService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly orm: MikroORM
	) {}

	@UseRequestContext()
	public async handle(event: RoomDeletedEvent): Promise<void> {
		const { id: roomId } = event;

		await this.columnBoardService.deleteByExternalReference({
			type: BoardExternalReferenceType.Room,
			id: roomId,
		});

		await this.roomMembershipService.deleteRoomMembership(roomId);
		await this.roomBoardService.deleteRoomContent(roomId);
	}
}
