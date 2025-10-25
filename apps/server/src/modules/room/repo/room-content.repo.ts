import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { RoomContentItem } from '../domain';
import { RoomContentEntity } from './entity';

@Injectable()
export class RoomContentRepo {
	constructor(private readonly em: EntityManager) {}

	public async findContentItemsByRoomId(roomId: string): Promise<RoomContentItem[]> {
		const roomContent = await this.em.findOneOrFail(RoomContentEntity, { roomId });

		return roomContent.items;
	}

	public async countByRoomId(roomId: string): Promise<number> {
		const count = await this.em.count(RoomContentEntity, { roomId });
		return count;
	}

	public async createContent(roomId: string, items: RoomContentItem[]): Promise<void> {
		this.em.create(RoomContentEntity, { roomId, items });
		await this.em.flush();
	}

	public async addItemToRoomContent(roomId: string, item: RoomContentItem): Promise<void> {
		const roomContent = await this.em.findOneOrFail(RoomContentEntity, { roomId });

		roomContent.items.push(item);
		await this.em.flush();
	}

	public async updateRoomContent(roomId: string, items: RoomContentItem[]): Promise<void> {
		const roomContent = await this.em.findOneOrFail(RoomContentEntity, { roomId });
		roomContent.items = items;
		await this.em.flush();
	}

	public async deleteContentByRoomId(roomId: string): Promise<void> {
		await this.em.nativeDelete(RoomContentEntity, { roomId });
	}
}
