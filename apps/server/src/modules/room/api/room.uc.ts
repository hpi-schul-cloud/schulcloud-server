import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { User } from '@shared/domain/entity';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { AuthorizationService } from '@modules/authorization';
import { Room, RoomService } from '../domain';
import { RoomConfig } from '../room.config';

@Injectable()
export class RoomUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		// TODO check authorization via authorizationService & room-group-service
		// this.authorizationService.checkPermission(user, room, AuthorizationContextBuilder.read([Permission.ROOM_VIEW]));
		if (!this.authorizationService.hasAllPermissions(user, [Permission.ROOM_VIEW])) {
			throw new UnauthorizedException();
		}

		const rooms = await this.roomService.getRooms(findOptions);
		return rooms;
	}
}
