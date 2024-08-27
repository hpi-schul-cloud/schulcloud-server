import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { Room } from '../do/room.do';
import { RoomRepo } from '../../repo/room.repo';

@Injectable()
export class RoomService {
	constructor(private readonly roomRepo: RoomRepo) {}

	public async getRooms(): Promise<Page<Room>> {
		const rooms: Page<Room> = await this.roomRepo.getRooms();

		return rooms;
	}
}
