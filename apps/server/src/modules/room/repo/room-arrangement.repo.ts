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

	public async hasArrangementForUserId(userId: EntityId): Promise<boolean> {
		const count = await this.em.count(RoomArrangementEntity, { userId });
		return count > 0;
	}

	public async createArrangement(userId: EntityId, items: RoomArrangementItem[]): Promise<void> {
		this.em.create(RoomArrangementEntity, { userId, items });
		await this.em.flush();
	}

	public async updateArrangement(userId: EntityId, items: RoomArrangementItem[]): Promise<void> {
		const roomArrangement = await this.em.findOneOrFail(RoomArrangementEntity, { userId });
		roomArrangement.items = items;
		await this.em.flush();
	}

	// TODO has to be used when the user is deleted
	// public async deleteArrangementByUserId(userId: EntityId): Promise<void> {
	// 	await this.em.nativeDelete(RoomArrangementEntity, { userId });
	// }
}
