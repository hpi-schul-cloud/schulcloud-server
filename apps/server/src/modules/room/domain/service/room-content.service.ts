import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomContentRepo } from '../../repo';
import { RoomContentItem, RoomContentType } from '../type';

@Injectable()
export class RoomContentService {
	constructor(private readonly roomContentRepo: RoomContentRepo) {}

	public async contentExists(roomId: EntityId): Promise<boolean> {
		const exists = (await this.roomContentRepo.countByRoomId(roomId)) > 0;

		return exists;
	}

	public async createContent(roomId: EntityId, boardIds: EntityId[]): Promise<void> {
		const items: RoomContentItem[] = boardIds.map((boardId) => {
			return { type: RoomContentType.BOARD, id: boardId };
		});
		await this.roomContentRepo.createContent(roomId, items);
	}

	public async getBoardIdList(roomId: EntityId): Promise<EntityId[]> {
		const items = await this.roomContentRepo.findContentItemsByRoomId(roomId);
		const boardIds = items.filter((item) => item.type === RoomContentType.BOARD).map((item) => item.id);

		return boardIds;
	}

	public async addBoard(roomId: EntityId, boardId: EntityId): Promise<void> {
		await this.roomContentRepo.addItemToRoomContent(roomId, { type: RoomContentType.BOARD, id: boardId });
	}

	public async moveBoard(roomId: EntityId, boardId: EntityId, toPosition: number): Promise<void> {
		const items = await this.roomContentRepo.findContentItemsByRoomId(roomId);

		if (toPosition < 0 || toPosition >= items.length) {
			throw new BadRequestException(`Invalid content position ${toPosition} for room '${roomId}'`);
		}

		const boardIndex = items.findIndex((item) => item.type === RoomContentType.BOARD && item.id === boardId);

		if (boardIndex === -1) {
			throw new BadRequestException(`Board with ID ${boardId} not found in room '${roomId}'`);
		}

		const [boardItem] = items.splice(boardIndex, 1);
		items.splice(toPosition, 0, boardItem);

		await this.roomContentRepo.updateRoomContent(roomId, items);
	}

	public async removeBoard(roomId: EntityId, boardId: EntityId): Promise<void> {
		const items = await this.roomContentRepo.findContentItemsByRoomId(roomId);
		const filteredItems = items.filter((item) => !(item.type === RoomContentType.BOARD && item.id === boardId));

		await this.roomContentRepo.updateRoomContent(roomId, filteredItems);
	}

	public async deleteContent(roomId: EntityId): Promise<void> {
		await this.roomContentRepo.deleteContentByRoomId(roomId);
	}
}
