import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomArrangementRepo } from '../../repo';
import { RoomArrangementItem } from '../type';
import { RoomService } from './room.service';

@Injectable()
export class RoomArrangementService {
	constructor(private readonly roomService: RoomService, private readonly roomArrangementRepo: RoomArrangementRepo) {}

	public async sortRoomIdsByUserArrangement(userId: EntityId, roomIds: EntityId[]): Promise<EntityId[]> {
		const arrangementExists = await this.roomArrangementRepo.hasArrangementForUserId(userId);

		let userIdsByArrangement: EntityId[];

		if (arrangementExists) {
			userIdsByArrangement = await this.sortAndUpdateArrangement(userId, roomIds);
		} else {
			await this.createArranagement(userId, roomIds);
			userIdsByArrangement = roomIds;
		}
		return userIdsByArrangement;
	}

	public async moveRoom(userId: EntityId, roomId: EntityId, toPosition: number): Promise<void> {
		const items = await this.roomArrangementRepo.findArrangementItemsByUserId(userId);

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

	public async deleteArrangement(userId: EntityId): Promise<void> {
		await this.roomArrangementRepo.deleteArrangementByUserId(userId);
	}

	private async createArranagement(userId: EntityId, roomIds: EntityId[]): Promise<void> {
		const items: RoomArrangementItem[] = roomIds.map((roomId) => {
			return { id: roomId };
		});

		await this.roomArrangementRepo.createArrangement(userId, items);
	}

	private async sortAndUpdateArrangement(userId: EntityId, availableRoomIds: EntityId[]): Promise<EntityId[]> {
		const roomIds = (await this.roomArrangementRepo.findArrangementItemsByUserId(userId)).map((item) => item.id);
		const roomIdSet = new Set(roomIds);

		const knownRoomIds = availableRoomIds
			.filter((roomId) => roomIdSet.has(roomId))
			.sort((a, b) => roomIds.indexOf(a) - roomIds.indexOf(b));
		const unknownRoomIds = availableRoomIds.filter((roomId) => !roomIdSet.has(roomId));

		const sortedRoomIds = [...knownRoomIds, ...unknownRoomIds];

		const items: RoomArrangementItem[] = sortedRoomIds.map((roomId) => {
			return { id: roomId };
		});

		await this.roomArrangementRepo.updateArrangement(userId, items);

		return sortedRoomIds;
	}
}
