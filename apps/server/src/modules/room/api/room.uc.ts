import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { IFindOptions } from '@shared/domain/interface';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Room, RoomService } from '../domain';
import { RoomConfig } from '../room.config';

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

	public async getRoomDetails(userId: EntityId, roomId: EntityId): Promise<Room> {
		this.checkFeatureEnabled();

		// TODO check authorization

		const room = await this.roomService.getRoomDetails(roomId);
		return room;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
