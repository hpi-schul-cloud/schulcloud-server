import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { IFindOptions } from '@shared/domain/interface';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Room, RoomCreateProps, RoomService, RoomUpdateProps } from '../domain';
import { RoomConfig } from '../room.config';
import { RoomColor } from '../domain/type';

@Injectable()
export class RoomUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		this.checkFeatureEnabled();

		// TODO check authorization
		// const user: User = await this.authorizationService.getUserWithPermissions(userId);

		const rooms = await this.roomService.getRooms(findOptions);
		return rooms;
	}

	public async createRoom(userId: EntityId, props: RoomCreateProps): Promise<Room> {
		this.checkFeatureEnabled();

		// TODO check authorization

		const room = await this.roomService.createRoom(props);
		return room;
	}

	public async getSingleRoom(userId: EntityId, roomId: EntityId): Promise<Room> {
		this.checkFeatureEnabled();

		// TODO check authorization

		const room = await this.roomService.getSingleRoom(roomId);
		return room;
	}

	public async updateRoom(userId: EntityId, roomId: EntityId, props: RoomUpdateProps): Promise<Room> {
		this.checkFeatureEnabled();

		// TODO check authorization

		const room = await this.roomService.getSingleRoom(roomId);
		await this.roomService.updateRoom(room, props);

		return room;
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		// TODO check authorization

		const room = await this.roomService.getSingleRoom(roomId);

		await this.roomService.deleteRoom(room);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
