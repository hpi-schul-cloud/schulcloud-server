import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomMembershipService } from '@modules/room-membership';
import { RoomRule } from '@modules/room-membership/authorization/room.rule';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { EntityId } from '@shared/domain/types';
import { RoomArrangementService, RoomService } from '../domain';
import { RoomWithAllowedOperationsAndLockedStatus } from './type/room-with-locked-status';
import { throwForbiddenIfFalse } from '@shared/common/utils/wrap-with-exception';

@Injectable()
export class RoomArrangementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomService: RoomService,
		private readonly roomArrangementService: RoomArrangementService,
		private readonly roomRule: RoomRule
	) {}

	public async getRoomsByUserArrangement(userId: EntityId): Promise<RoomWithAllowedOperationsAndLockedStatus[]> {
		const accessibleRoomAuthorizables = await this.roomMembershipService.getRoomAuthorizablesByUserId(userId);
		const roomIds = accessibleRoomAuthorizables.map((item) => item.roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const rooms = await this.roomService.getRoomsByIds(roomIds);
		const existingRoomIds = rooms.map((room) => room.id);
		const orderedRoomIds = await this.roomArrangementService.sortRoomIdsByUserArrangement(userId, existingRoomIds);
		rooms.sort((a, b) => orderedRoomIds.indexOf(a.id) - orderedRoomIds.indexOf(b.id));

		const roomsWithAllowedOperationsAndLockedStatus = rooms
			.map((room) => {
				const roomAuthorizable = accessibleRoomAuthorizables.find((item) => item.roomId === room.id);
				if (!roomAuthorizable) return null;
				const allowedOperations = this.roomRule.listAllowedOperations(user, roomAuthorizable);

				const hasOwner = accessibleRoomAuthorizables.some(
					(item) =>
						item.roomId === room.id &&
						item.members.some((member) => member.roles.some((role) => role.name === RoleName.ROOMOWNER))
				);
				return {
					room,
					allowedOperations,
					isLocked: !hasOwner,
				};
			})
			.filter((room) => TypeGuard.isNotNullOrUndefined(room));

		return roomsWithAllowedOperationsAndLockedStatus;
	}

	public async moveRoomInUserArrangement(userId: EntityId, roomId: EntityId, toPosition: number): Promise<void> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.roomRule.can('accessRoom', user, roomAuthorizable));

		await this.roomArrangementService.moveRoom(userId, roomId, toPosition);
	}
}
