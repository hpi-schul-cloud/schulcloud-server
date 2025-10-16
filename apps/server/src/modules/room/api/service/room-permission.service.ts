import { EntityId } from '@shared/domain/types';
import { Action, AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { RoomConfig } from '../../room.config';
import { RoleName } from '@modules/role';
import { RoomService } from '../../domain/service/room.service';
import { LockedRoomLoggableException } from '../loggables/locked-room-loggable-exception';
import { Room } from '@modules/room';
import { User } from '@modules/user/repo';

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
	): Promise<RoomMembershipAuthorizable> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, { action, requiredPermissions });

		return roomMembershipAuthorizable;
	}

	public async hasRoomPermissions(
		userId: EntityId,
		roomId: EntityId,
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<boolean> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const hasRoomPermissions = this.authorizationService.hasPermission(user, roomMembershipAuthorizable, {
			action,
			requiredPermissions,
		});

		return hasRoomPermissions;
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

	public async checkRoomIsUnlocked(roomId: EntityId): Promise<void> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);

		const hasOwner = roomMembershipAuthorizable.members.some((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);

		if (!hasOwner) {
			const room = await this.roomService.getSingleRoom(roomId);
			throw new LockedRoomLoggableException(room.name, room.id);
		}
	}

	public async isAllowedToDeleteRoom(user: User, room: Room): Promise<boolean> {
		const canDeleteRoom = await this.hasRoomPermissions(user.id, room.id, Action.write, [Permission.ROOM_DELETE_ROOM]);
		const isOwnSchool = room.schoolId === user.school.id;
		const canAdministrateSchoolRooms = this.authorizationService.hasOneOfPermissions(user, [
			Permission.SCHOOL_ADMINISTRATE_ROOMS,
		]);
		const isAllowed = canDeleteRoom || (isOwnSchool && canAdministrateSchoolRooms);
		return isAllowed;
	}
}
