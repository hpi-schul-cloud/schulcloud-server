import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { RoomRule } from '@modules/room-membership/authorization/room.rule';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils/wrap-with-exception';
import { EntityId } from '@shared/domain/types';
import {
	Room,
	RoomArrangementRoomInfo,
	RoomArrangementService,
	RoomGroupUpdate,
	RoomPositionCommand,
	RoomService,
	VisibleRoomArrangement,
	VisibleRoomArrangementWithCreatedGroup,
} from '../domain';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '../room.config';
import { RoomWithAllowedOperationsAndLockedStatus } from './type/room-with-locked-status';

interface UserRoomAccess {
	roomAuthorizables: RoomAuthorizable[];
	rooms: Room[];
	accessibleRooms: RoomArrangementRoomInfo[];
}

@Injectable()
export class RoomArrangementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomService: RoomService,
		private readonly roomArrangementService: RoomArrangementService,
		private readonly roomRule: RoomRule,
		@Inject(ROOM_PUBLIC_API_CONFIG_TOKEN) private readonly config: RoomPublicApiConfig
	) {}

	public async getRoomsByUserArrangement(userId: EntityId): Promise<RoomWithAllowedOperationsAndLockedStatus[]> {
		const { roomAuthorizables, rooms, accessibleRooms } = await this.getUserRoomAccess(userId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const arrangement = await this.roomArrangementService.getReconciledArrangement(userId, accessibleRooms);
		const orderedRoomIds = arrangement.getVisibleRoomIdsInOrder(accessibleRooms);

		const roomsWithAllowedOperationsAndLockedStatus = orderedRoomIds
			.map((roomId) => {
				const room = rooms.find((item) => item.id === roomId);
				const roomAuthorizable = roomAuthorizables.find((item) => item.roomId === roomId);
				if (!room || !roomAuthorizable) return null;
				const allowedOperations = this.roomRule.listAllowedOperations(user, roomAuthorizable);

				const hasOwner = roomAuthorizables.some(
					(item) =>
						item.roomId === room.id &&
						item.members.some((member) => member.roles.some((role) => role.name === RoleName.ROOMOWNER))
				);
				return {
					room,
					allowedOperations,
					isLocked: !hasOwner,
					totalMembers: roomAuthorizable.members.length,
				};
			})
			.filter((room) => TypeGuard.isNotNullOrUndefined(room));

		return roomsWithAllowedOperationsAndLockedStatus;
	}

	public async moveRoomInUserArrangement(userId: EntityId, roomId: EntityId, toPosition: number): Promise<void> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		throwForbiddenIfFalse(this.roomRule.can('arrangeRooms', user, roomAuthorizable));

		const { accessibleRooms } = await this.getUserRoomAccess(userId);

		await this.roomArrangementService.moveRoomToVisibleUngroupedPosition(userId, roomId, toPosition, accessibleRooms);
	}

	public async getArrangement(userId: EntityId): Promise<VisibleRoomArrangement> {
		this.checkFeatureRoomGroupingEnabled();

		const { accessibleRooms } = await this.getUserRoomAccess(userId);
		const arrangement = await this.roomArrangementService.getReconciledArrangement(userId, accessibleRooms);

		return arrangement.getVisibleArrangement(accessibleRooms);
	}

	public async createGroup(
		userId: EntityId,
		expectedRevision: number,
		name: string
	): Promise<VisibleRoomArrangementWithCreatedGroup> {
		this.checkFeatureRoomGroupingEnabled();

		const { accessibleRooms } = await this.getUserRoomAccess(userId);
		const { arrangement, createdGroupId } = await this.roomArrangementService.createGroup(
			userId,
			expectedRevision,
			accessibleRooms,
			name
		);

		return { ...arrangement.getVisibleArrangement(accessibleRooms), createdGroupId };
	}

	public async updateGroup(
		userId: EntityId,
		expectedRevision: number,
		groupId: EntityId,
		update: RoomGroupUpdate
	): Promise<VisibleRoomArrangement> {
		this.checkFeatureRoomGroupingEnabled();

		const { accessibleRooms } = await this.getUserRoomAccess(userId);
		const arrangement = await this.roomArrangementService.updateGroup(
			userId,
			expectedRevision,
			accessibleRooms,
			groupId,
			update
		);

		return arrangement.getVisibleArrangement(accessibleRooms);
	}

	public async deleteGroup(
		userId: EntityId,
		expectedRevision: number,
		groupId: EntityId,
		disableFutureConfirmation: boolean
	): Promise<VisibleRoomArrangement> {
		this.checkFeatureRoomGroupingEnabled();

		const { accessibleRooms } = await this.getUserRoomAccess(userId);
		const arrangement = await this.roomArrangementService.deleteGroup(
			userId,
			expectedRevision,
			accessibleRooms,
			groupId,
			disableFutureConfirmation
		);

		return arrangement.getVisibleArrangement(accessibleRooms);
	}

	public async updateGroupOrder(
		userId: EntityId,
		expectedRevision: number,
		groupIds: EntityId[]
	): Promise<VisibleRoomArrangement> {
		this.checkFeatureRoomGroupingEnabled();

		const { accessibleRooms } = await this.getUserRoomAccess(userId);
		const arrangement = await this.roomArrangementService.reorderGroups(
			userId,
			expectedRevision,
			accessibleRooms,
			groupIds
		);

		return arrangement.getVisibleArrangement(accessibleRooms);
	}

	public async moveRoomToPosition(
		userId: EntityId,
		expectedRevision: number,
		command: RoomPositionCommand
	): Promise<VisibleRoomArrangement> {
		this.checkFeatureRoomGroupingEnabled();

		const { roomAuthorizables, accessibleRooms } = await this.getUserRoomAccess(userId);
		const roomAuthorizable = roomAuthorizables.find((item) => item.roomId === command.roomId);
		if (!roomAuthorizable) {
			throw new ForbiddenException();
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);
		throwForbiddenIfFalse(this.roomRule.can('arrangeRooms', user, roomAuthorizable));

		const arrangement = await this.roomArrangementService.moveRoom(userId, expectedRevision, accessibleRooms, command);

		return arrangement.getVisibleArrangement(accessibleRooms);
	}

	public async updatePreferences(
		userId: EntityId,
		expectedRevision: number,
		confirmGroupDeletion: boolean
	): Promise<VisibleRoomArrangement> {
		this.checkFeatureRoomGroupingEnabled();

		const { accessibleRooms } = await this.getUserRoomAccess(userId);
		const arrangement = await this.roomArrangementService.setConfirmGroupDeletion(
			userId,
			expectedRevision,
			accessibleRooms,
			confirmGroupDeletion
		);

		return arrangement.getVisibleArrangement(accessibleRooms);
	}

	/**
	 * Authoritative input for reconciliation: all rooms the user is a member of that still exist.
	 * Archived rooms stay in the arrangement but are hidden while the archive feature is enabled, because they have
	 * their own listing then. While the feature is disabled they stay visible to remain reachable.
	 */
	private async getUserRoomAccess(userId: EntityId): Promise<UserRoomAccess> {
		const roomAuthorizables = await this.roomMembershipService.getRoomAuthorizablesByUserId(userId);
		const rooms = await this.roomService.getRoomsByIds(roomAuthorizables.map((item) => item.roomId));

		const accessibleRooms = rooms.map((room): RoomArrangementRoomInfo => {
			return {
				id: room.id,
				createdAt: room.createdAt,
				isVisible: !this.config.featureRoomArchiveEnabled || !room.isArchived,
			};
		});

		return { roomAuthorizables, rooms, accessibleRooms };
	}

	private checkFeatureRoomGroupingEnabled(): void {
		if (!this.config.featureRoomGroupingEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_GROUPING_ENABLED');
		}
	}
}
