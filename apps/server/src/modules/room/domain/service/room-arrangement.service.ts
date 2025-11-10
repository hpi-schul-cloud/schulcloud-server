import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomArrangementRepo } from '../../repo';
import { RoomArrangementItem } from '../type';
import { RoomService } from './room.service';

@Injectable()
export class RoomArrangementService {
	constructor(private readonly roomService: RoomService, private readonly roomArrangementRepo: RoomArrangementRepo) {}

	public async arrangementExists(userId: EntityId): Promise<boolean> {
		const numberOfArrangements = await this.roomArrangementRepo.countByUserId(userId);
		const exists = numberOfArrangements > 0;

		return exists;
	}

	public async createArrangement(userId: EntityId, roomIds: EntityId[]): Promise<void> {
		const items: RoomArrangementItem[] = roomIds.map((roomId) => {
			return { id: roomId };
		});
		await this.roomArrangementRepo.createArrangement(userId, items);
	}

	public async getRoomOrder(userId: EntityId): Promise<EntityId[]> {
		const items = await this.roomArrangementRepo.findArrangementItemsByUserId(userId);
		const roomIds = items.map((item) => item.id);

		return roomIds;
	}

	public async addRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		await this.roomArrangementRepo.addItemToArrangement(userId, { id: roomId });
	}

	public async moveRoom(userId: EntityId, roomId: EntityId, toPosition: number): Promise<void> {
		// TOTO use real repo method when lazy init is fixed
		// const items = await this.roomArrangementRepo.findArrangementItemsByUserId(userId);
		const items: RoomArrangementItem[] = [];

		if (toPosition < 0 || toPosition >= items.length) {
			throw new BadRequestException(`Invalid position ${toPosition} for room arrangement of user '${userId}'`);
		}

		const roomIndex = items.findIndex((item) => item.id === roomId);

		if (roomIndex === -1) {
			throw new BadRequestException(`Room with ID ${roomId} not found in arrangement of user '${userId}'`);
		}

		const [roomItem] = items.splice(roomIndex, 1);
		items.splice(toPosition, 0, roomItem);

		await this.roomArrangementRepo.updateArrangement(userId, items);
	}

	public async removeRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		const items = await this.roomArrangementRepo.findArrangementItemsByUserId(userId);
		const filteredItems = items.filter((item) => !(item.id === roomId));

		await this.roomArrangementRepo.updateArrangement(userId, filteredItems);
	}

	public async deleteArrangement(userId: EntityId): Promise<void> {
		await this.roomArrangementRepo.deleteArrangementByUserId(userId);
	}
}
