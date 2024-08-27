import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { ConfigService } from '@nestjs/config';
import { RoomService } from '../domain/service';
import { Room } from '../domain/do/room.do';
import { AuthorizationContextBuilder, AuthorizationService } from '../../authorization';
import { RoomConfig } from '../room.config';
import {FeatureDisabledLoggableException} from "@shared/common/loggable-exception";

export class RoomUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService
	) {}

	async getRooms(userId: EntityId, pagination: , names?: string): Promise<Page<Room>> {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, room, AuthorizationContextBuilder.read([Permission.GROUP_VIEW]));

		const rooms = await this.roomService.getRooms();
		return rooms;
	}
}
