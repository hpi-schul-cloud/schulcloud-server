import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { RoomRule } from '@modules/room-membership/authorization/room.rule';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomArrangementService, RoomService } from '../domain';
import { RoomPermissionService } from './service';
import { RoomWithPermissionsAndLockedStatus } from './type/room-with-locked-status';

@Injectable()
export class RoomArrangementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomService: RoomService,
		private readonly roomPermissionService: RoomPermissionService,
		private readonly roomArrangementService: RoomArrangementService,
		private readonly roomRule: RoomRule
	) {}

	public async getRoomsByUserArrangement(userId: EntityId): Promise<RoomWithPermissionsAndLockedStatus[]> {
		const accessibleRoomAuthorizables = await this.roomMembershipService.getRoomAuthorizablesByUserId(userId);
		const roomIds = accessibleRoomAuthorizables.map((item) => item.roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const rooms = await this.roomService.getRoomsByIds(roomIds);
		const existingRoomIds = rooms.map((room) => room.id);
		const orderedRoomIds = await this.roomArrangementService.sortRoomIdsByUserArrangement(userId, existingRoomIds);
		rooms.sort((a, b) => orderedRoomIds.indexOf(a.id) - orderedRoomIds.indexOf(b.id));

		const roomsWithPermissionsAndLockedStatus = rooms
			.map((room) => {
				const roomAuthorizable = accessibleRoomAuthorizables.find((item) => item.roomId === room.id);
				if (!roomAuthorizable) return null;
				const permissions = this.getPermissions(userId, roomAuthorizable);
				const allowedOperations = this.roomRule.listAllowedOperations(user, roomAuthorizable);

				const hasOwner = accessibleRoomAuthorizables.some(
					(item) =>
						item.roomId === room.id &&
						item.members.some((member) => member.roles.some((role) => role.name === RoleName.ROOMOWNER))
				);
				return {
					room,
					permissions,
					allowedOperations,
					isLocked: !hasOwner,
				};
			})
			.filter((item) => !!item);

		return roomsWithPermissionsAndLockedStatus;
	}

	public async moveRoomInUserArrangement(userId: EntityId, roomId: EntityId, toPosition: number): Promise<void> {
		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.read);

		await this.roomArrangementService.moveRoom(userId, roomId, toPosition);
	}

	private getPermissions(userId: EntityId, roomAuthorizable: RoomAuthorizable): Permission[] {
		const permissions = roomAuthorizable.members
			.filter((member) => member.userId === userId)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		return permissions;
	}
}
