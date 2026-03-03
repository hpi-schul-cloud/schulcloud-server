import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '@modules/board';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomContentService } from '../../domain/service/room-content.service';

@Injectable()
export class RoomBoardService {
	constructor(
		private readonly columnBoardService: ColumnBoardService,
		private readonly roomContentService: RoomContentService
	) {}

	public async getOrderedBoards(roomId: EntityId): Promise<ColumnBoard[]> {
		const boards = await this.syncRoomContent(roomId);
		const boardIds = await this.roomContentService.getBoardOrder(roomId);
		boards.sort((a, b) => boardIds.indexOf(a.id) - boardIds.indexOf(b.id));
		return boards;
	}

	public async addBoardToRoom(roomId: EntityId, boardId: EntityId): Promise<void> {
		await this.syncRoomContent(roomId);
		await this.roomContentService.addBoard(roomId, boardId);
	}

	public async moveBoardInRoom(roomId: EntityId, boardId: EntityId, toPosition: number): Promise<void> {
		await this.syncRoomContent(roomId);
		await this.roomContentService.moveBoard(roomId, boardId, toPosition);
	}

	public async removeBoardFromRoom(roomId: EntityId, boardId: EntityId): Promise<void> {
		await this.syncRoomContent(roomId);
		await this.roomContentService.removeBoard(roomId, boardId);
	}

	public async deleteRoomContent(roomId: EntityId): Promise<void> {
		await this.columnBoardService.deleteByExternalReference({
			type: BoardExternalReferenceType.Room,
			id: roomId,
		});
		await this.roomContentService.deleteContent(roomId);
	}

	public async copyRoomContent(
		sourceRoomId: EntityId,
		targetRoomId: EntityId,
		boardMappings: Map<EntityId, EntityId>
	): Promise<void> {
		await this.syncRoomContent(sourceRoomId);
		const sourceBoardIds = await this.roomContentService.getBoardOrder(sourceRoomId);
		const targetBoardIds = (await this.getAvailableBoardsInRoom(targetRoomId)).map((board) => board.id);

		// 1. Ordered mapped target IDs
		const mappedTargetIds = sourceBoardIds
			.map((sourceId) => boardMappings.get(sourceId))
			.filter((targetId): targetId is EntityId => !!targetId && targetBoardIds.includes(targetId));

		// 2. Append unmapped target IDs
		const appendedUnmappedIds = targetBoardIds.filter((targetId) => !mappedTargetIds.includes(targetId));

		const orderedTargetBoardIds = [...mappedTargetIds, ...appendedUnmappedIds];

		const contentExists = await this.roomContentService.contentExists(targetRoomId);
		if (contentExists) {
			await this.roomContentService.deleteContent(targetRoomId);
		}
		await this.roomContentService.createContent(targetRoomId, orderedTargetBoardIds);
	}

	private async getAvailableBoardsInRoom(roomId: EntityId): Promise<ColumnBoard[]> {
		const boardIdsInRoom = await this.columnBoardService.findByExternalReference(
			{
				type: BoardExternalReferenceType.Room,
				id: roomId,
			},
			0
		);
		return boardIdsInRoom;
	}

	private async syncRoomContent(roomId: EntityId): Promise<ColumnBoard[]> {
		const availableBoards = await this.getAvailableBoardsInRoom(roomId);
		const availableBoardIds = availableBoards.map((board) => board.id);

		const contentExists = await this.roomContentService.contentExists(roomId);

		if (!contentExists) {
			await this.roomContentService.createContent(roomId, availableBoardIds);
			return availableBoards;
		}

		const existingBoardOrder = await this.roomContentService.getBoardOrder(roomId);
		const hasRemovedBoards = existingBoardOrder.some((id) => !availableBoardIds.includes(id));
		const hasAddedBoards = availableBoardIds.some((id) => !existingBoardOrder.includes(id));

		if (hasRemovedBoards || hasAddedBoards) {
			const retainedBoardIds = existingBoardOrder.filter((id) => availableBoardIds.includes(id));
			const appendedBoardIds = availableBoardIds.filter((id) => !existingBoardOrder.includes(id));
			const syncedBoardIds = [...retainedBoardIds, ...appendedBoardIds];

			await this.roomContentService.deleteContent(roomId);
			await this.roomContentService.createContent(roomId, syncedBoardIds);
		}

		return availableBoards;
	}
}
