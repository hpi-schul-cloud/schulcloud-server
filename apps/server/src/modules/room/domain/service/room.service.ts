import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomRepo } from '../../repo';
import { Room } from '../do';

@Injectable()
export class RoomService {
	constructor(private readonly roomRepo: RoomRepo) {}

	public async getRooms(findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		const rooms: Page<Room> = await this.roomRepo.findRooms(findOptions);

		return rooms;
	}

	public async getSingleRoom(roomId: EntityId): Promise<Room> {
		const room = await this.roomRepo.findById(roomId);

		return room;
	}

	public async deleteRoom(room: Room): Promise<void> {
		await this.roomRepo.delete(room);
	}
}
