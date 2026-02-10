import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomService } from '../../domain/service/room.service';
import { RoomConfig } from '../../room.config';
import { LockedRoomLoggableException } from '../loggables/locked-room-loggable-exception';

@Injectable()
export class RoomPermissionService {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
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
		if (!this.configService.get('FEATURE_ADMINISTRATE_ROOMS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ADMINISTRATE_ROOMS_ENABLED');
		}
	}

	public checkFeatureRoomCopyEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_COPY_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_COPY_ENABLED');
		}
	}
}
