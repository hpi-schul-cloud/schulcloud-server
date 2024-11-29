import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ValidationError } from '@shared/common';
import { RoomRepo } from '../../repo';
import { Room, RoomCreateProps, RoomProps, RoomUpdateProps } from '../do';

@Injectable()
export class RoomService {
	constructor(private readonly roomRepo: RoomRepo) {}

	public async getRooms(findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		const rooms: Page<Room> = await this.roomRepo.findRooms(findOptions);

		return rooms;
	}

	public async getRoomsByIds(roomIds: EntityId[], findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		const rooms: Page<Room> = await this.roomRepo.findRoomsByIds(roomIds, findOptions);

		return rooms;
	}

	public async createRoom(props: RoomCreateProps): Promise<Room> {
		const roomProps: RoomProps = {
			id: new ObjectId().toHexString(),
			...props,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.validateTimeSpan(props, roomProps.id);
		const room = new Room(roomProps);

		await this.roomRepo.save(room);

		return room;
	}

	public async getSingleRoom(roomId: EntityId): Promise<Room> {
		const room = await this.roomRepo.findById(roomId);

		return room;
	}

	public async updateRoom(room: Room, props: RoomUpdateProps): Promise<void> {
		this.validateTimeSpan(props, room.id);
		Object.assign(room, props);

		await this.roomRepo.save(room);
	}

	public async deleteRoom(room: Room): Promise<void> {
		await this.roomRepo.delete(room);
	}

	private validateTimeSpan(props: RoomCreateProps | RoomUpdateProps, roomId: string): void {
		if (props.startDate != null && props.endDate != null && props.startDate > props.endDate) {
			throw new ValidationError(
				`Invalid room timespan. Start date '${props.startDate.toISOString()}' has to be before end date: '${props.endDate.toISOString()}'. Room id='${roomId}'`
			);
		}
	}
}
