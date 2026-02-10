import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { Inject, Injectable } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomService } from '../../domain/service/room.service';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '../../room.config';
import { LockedRoomLoggableException } from '../loggables/locked-room-loggable-exception';

@Injectable()
export class RoomPermissionService {
	constructor(
		@Inject(ROOM_PUBLIC_API_CONFIG_TOKEN) private readonly config: RoomPublicApiConfig,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomService: RoomService
	) {}

	public async checkRoomAuthorizationByIds(
		userId: EntityId,
		roomId: EntityId,
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<RoomAuthorizable> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, roomAuthorizable, { action, requiredPermissions });

		return roomAuthorizable;
	}

	public async hasRoomPermissions(
		userId: EntityId,
		roomId: EntityId,
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<boolean> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const hasRoomPermissions = this.authorizationService.hasPermission(user, roomAuthorizable, {
			action,
			requiredPermissions,
		});

		return hasRoomPermissions;
	}

	public async checkRoomIsUnlocked(roomId: EntityId): Promise<void> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		const hasOwner = roomAuthorizable.members.some((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);

		if (!hasOwner) {
			const room = await this.roomService.getSingleRoom(roomId);
			throw new LockedRoomLoggableException(room.name, room.id);
		}
	}

	public checkFeatureAdministrateRoomsEnabled(): void {
		if (!this.config.featureAdministrateRoomsEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_ADMINISTRATE_ROOMS_ENABLED');
		}
	}

	public checkFeatureRoomCopyEnabled(): void {
		if (!this.config.featureRoomCopyEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_COPY_ENABLED');
		}
	}
}
