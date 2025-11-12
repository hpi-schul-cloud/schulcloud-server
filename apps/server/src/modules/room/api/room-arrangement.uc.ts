import { Injectable } from '@nestjs/common';
import { RoomArrangementService, RoomService } from '../domain';
import { EntityId } from '@shared/domain/types';
import { RoomPermissionService } from './service';
import { Action, AuthorizationService } from '@modules/authorization';
import { RoomMembershipService } from '@modules/room-membership';
import { RoleName } from '@modules/role';
import { RoomWithLockedStatus } from './type/room-with-locked-status';

@Injectable()
export class RoomArrangementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomService: RoomService,
		private readonly roomPermissionService: RoomPermissionService,
		private readonly roomArrangementService: RoomArrangementService
	) {}

	public async getRoomsByUserArrangement(userId: EntityId): Promise<RoomWithLockedStatus[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMembershipService.getRoomMembershipAuthorizablesByUserId(userId);

		const readableRoomIds = await this.roomPermissionService.getReadableRoomIdsForUser(user);
		const rooms = await this.roomService.getRoomsByIds(readableRoomIds);

		const roomsWithLockedStatus = rooms.map((room) => {
			const hasOwner = roomAuthorizables.some(
				(item) =>
					item.roomId === room.id &&
					item.members.some((member) => member.roles.some((role) => role.name === RoleName.ROOMOWNER))
			);
			return {
				room,
				isLocked: !hasOwner,
			};
		});

		return roomsWithLockedStatus;
	}

	public async moveRoomInUserArrangement(userId: EntityId, roomId: EntityId, toPosition: number): Promise<void> {
		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.read);

		await this.roomArrangementService.moveRoom(userId, roomId, toPosition);
	}
}
