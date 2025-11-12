import { Injectable } from '@nestjs/common';
import { RoomService } from '../domain';
import { RoomBoardService, RoomPermissionService } from './service';
import { EntityId } from '@shared/domain/types';
import { Action } from '@modules/authorization';
import type { ColumnBoard } from '@modules/board';

@Injectable()
export class RoomContentUc {
	constructor(
		private readonly roomService: RoomService,
		private readonly roomPermissionService: RoomPermissionService,
		private readonly roomBoardService: RoomBoardService
	) {}

	public async getRoomBoards(userId: EntityId, roomId: EntityId): Promise<ColumnBoard[]> {
		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomIsUnlocked(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.read);

		const boards = await this.roomBoardService.getOrderedBoards(roomId);

		return boards;
	}

	public async moveBoard(userId: EntityId, roomId: EntityId, boardId: EntityId, toPosition: number): Promise<void> {
		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomIsUnlocked(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.write);

		await this.roomBoardService.moveBoardInRoom(roomId, boardId, toPosition);
	}
}
