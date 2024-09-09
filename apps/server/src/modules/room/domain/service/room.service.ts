import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { Room } from '../do';
import { RoomRepo } from '../../repo';

@Injectable()
export class RoomService {
	constructor(private readonly roomRepo: RoomRepo) {}

	public async getRooms(findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		const rooms: Page<Room> = await this.roomRepo.findRooms(findOptions);

		return rooms;
	}
}
