import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { RoomArrangementItem } from '../domain';
import { RoomArrangementEntity } from './entity';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class RoomArrangementRepo {
	constructor(private readonly em: EntityManager) {}

	public async findArrangementItemsByUserId(userId: EntityId): Promise<RoomArrangementItem[]> {
		const roomArrangement = await this.em.findOneOrFail(RoomArrangementEntity, { userId });

		return roomArrangement.items;
	}

	public async findArrangementsByRoomId(roomId: EntityId): Promise<RoomArrangementEntity[]> {
		const result = await this.em.aggregate(RoomArrangementEntity, [
			{
				$match: {
					'items.id': roomId, // Matches documents where items array contains an object with id = roomId
				},
			},
		]);

		return result as RoomArrangementEntity[];
	}

	public async hasArrangementForUserId(userId: EntityId): Promise<boolean> {
		const count = await this.em.count(RoomArrangementEntity, { userId });
		return count > 0;
	}

	public async createArrangement(userId: EntityId, items: RoomArrangementItem[]): Promise<void> {
		this.em.create(RoomArrangementEntity, { userId, items });
		await this.em.flush();
	}

	public async addItemToUserArrangements(userIds: EntityId[], item: RoomArrangementItem): Promise<void> {
		const roomArrangements = await this.em.find(RoomArrangementEntity, { userId: { $in: userIds } });

		for (const roomArrangement of roomArrangements) {
			const exists = roomArrangement.items.some((existingItem) => existingItem.id === item.id);
			if (!exists) {
				roomArrangement.items.push(item);
			}
		}

		await this.em.flush();
	}

	public async removeRoomFromAllArrangements(roomId: EntityId): Promise<void> {
		const roomArrangements = (await this.em.aggregate(RoomArrangementEntity, [
			{
				$match: {
					'items.id': roomId,
				},
			},
		])) as RoomArrangementEntity[];

		for (const roomArrangement of roomArrangements) {
			roomArrangement.items = roomArrangement.items.filter((item) => item.id !== roomId);
		}

		await this.em.flush();
	}

	public async updateArrangement(userId: EntityId, items: RoomArrangementItem[]): Promise<void> {
		const roomArrangement = await this.em.findOneOrFail(RoomArrangementEntity, { userId });
		roomArrangement.items = items;
		await this.em.flush();
	}

	public async deleteArrangementByUserId(userId: EntityId): Promise<void> {
		await this.em.nativeDelete(RoomArrangementEntity, { userId });
	}
}
