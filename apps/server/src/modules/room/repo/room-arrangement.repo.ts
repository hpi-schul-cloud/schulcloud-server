import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { RoomArrangementItem } from '../domain';
import { RoomArrangementEntity } from './entity';

@Injectable()
export class RoomArrangementRepo {
	constructor(private readonly em: EntityManager) {}

	public async findArrangementItemsByUserId(userId: string): Promise<RoomArrangementItem[]> {
		const roomArrangement = await this.em.findOneOrFail(RoomArrangementEntity, { userId });

		return roomArrangement.items;
	}

	public async countByUserId(userId: string): Promise<number> {
		const count = await this.em.count(RoomArrangementEntity, { userId });
		return count;
	}

	public async createArrangement(userId: string, items: RoomArrangementItem[]): Promise<void> {
		this.em.create(RoomArrangementEntity, { userId, items });
		await this.em.flush();
	}

	public async addItemToArrangement(userId: string, item: RoomArrangementItem): Promise<void> {
		const roomArrangement = await this.em.findOneOrFail(RoomArrangementEntity, { userId });

		const exists = roomArrangement.items.some((existingItem) => existingItem.id === item.id);
		if (!exists) {
			roomArrangement.items.push(item);
			await this.em.flush();
		}
	}

	public async updateArrangement(userId: string, items: RoomArrangementItem[]): Promise<void> {
		const roomArrangement = await this.em.findOneOrFail(RoomArrangementEntity, { userId });
		roomArrangement.items = items;
		await this.em.flush();
	}

	public async deleteArrangementByUserId(userId: string): Promise<void> {
		await this.em.nativeDelete(RoomArrangementEntity, { userId });
	}
}
