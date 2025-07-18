import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomRepo } from '../../repo';
import { Room, RoomCreateProps, RoomProps, RoomUpdateProps } from '../do';
import { EventBus } from '@nestjs/cqrs';
import { RoomDeletedEvent } from '../events/room-deleted.event';
import { RoomFeatures } from '../type';

@Injectable()
export class RoomService {
	constructor(private readonly roomRepo: RoomRepo, private readonly eventBus: EventBus) {}

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
			name: props.name,
			color: props.color,
			schoolId: props.schoolId,
			features: props.features,
			// make sure that the dates are not null at runtime
			startDate: props.startDate ?? undefined,
			endDate: props.endDate ?? undefined,
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

		room.name = props.name;
		room.color = props.color;
		room.features = props.features;
		// make sure that the dates are not null at runtime
		room.startDate = props.startDate ?? undefined;
		room.endDate = props.endDate ?? undefined;

		await this.roomRepo.save(room);
	}

	public async deleteRoom(room: Room): Promise<void> {
		await this.roomRepo.delete(room);

		await this.eventBus.publish(new RoomDeletedEvent(room.id));
	}

	public canEditorManageVideoconferences(room: Room): boolean {
		return room.features.includes(RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE);
	}

	private validateTimeSpan(props: RoomCreateProps | RoomUpdateProps, roomId: string): void {
		if (props.startDate != null && props.endDate != null && props.startDate > props.endDate) {
			throw new ValidationError(
				`Invalid room timespan. Start date '${props.startDate.toISOString()}' has to be before end date: '${props.endDate.toISOString()}'. Room id='${roomId}'`
			);
		}
	}
}
