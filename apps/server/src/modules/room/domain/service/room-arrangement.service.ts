import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomArrangementRepo } from '../../repo';
import { RoomArrangement } from '../do/room-arrangement.do';
import { RoomArrangementConflictError } from '../error/room-arrangement-conflict.error';
import {
	RoomArrangementConflictReason,
	RoomArrangementPreferencesUpdate,
	RoomArrangementRoomInfo,
	RoomGroupUpdate,
	RoomPositionCommand,
} from '../type/room-arrangement';

export const MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS = 3;

type RoomArrangementCommand = (arrangement: RoomArrangement) => boolean;

@Injectable()
export class RoomArrangementService {
	constructor(private readonly roomArrangementRepo: RoomArrangementRepo) {}

	/**
	 * Loads (and lazily creates) the arrangement and reconciles it with the authoritative list of rooms the user is
	 * a member of. The arrangement is only written, and its revision only increased, when reconciliation changed it.
	 */
	public async getReconciledArrangement(
		userId: EntityId,
		accessibleRooms: RoomArrangementRoomInfo[]
	): Promise<RoomArrangement> {
		let arrangement = await this.roomArrangementRepo.findOrCreateByUserId(userId);

		for (let attempt = 1; attempt <= MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS; attempt += 1) {
			const changed = arrangement.reconcile(accessibleRooms);
			if (!changed) {
				return arrangement;
			}

			const saved = await this.roomArrangementRepo.updateIfRevisionMatches(arrangement);
			if (saved || attempt === MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS) {
				return arrangement;
			}

			arrangement = await this.roomArrangementRepo.findOrCreateByUserId(userId);
		}

		return arrangement;
	}

	public async createGroup(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		name: string
	): Promise<{ arrangement: RoomArrangement; createdGroupId: EntityId }> {
		const createdGroupId = new ObjectId().toHexString();

		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) => {
			item.createGroup(createdGroupId, name);

			return true;
		});

		return { arrangement, createdGroupId };
	}

	public async updateGroup(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		groupId: EntityId,
		update: RoomGroupUpdate
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) =>
			item.updateGroup(groupId, update)
		);

		return arrangement;
	}

	public async deleteGroup(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		groupId: EntityId,
		disableFutureConfirmation: boolean
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) => {
			item.deleteGroup(groupId, disableFutureConfirmation);

			return true;
		});

		return arrangement;
	}

	public async reorderGroups(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		groupIds: EntityId[]
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) =>
			item.reorderGroups(groupIds)
		);

		return arrangement;
	}

	public async moveRoom(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		command: RoomPositionCommand
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) =>
			item.moveRoom(command, accessibleRooms)
		);

		return arrangement;
	}

	public async setAllGroupsCollapsed(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		collapsed: boolean
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) =>
			item.setAllGroupsCollapsed(collapsed)
		);

		return arrangement;
	}

	public async moveRoomsToSection(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		roomIds: EntityId[],
		targetGroupId: EntityId | null
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) =>
			item.moveRoomsToSection(roomIds, targetGroupId, accessibleRooms)
		);

		return arrangement;
	}

	public async updatePreferences(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		update: RoomArrangementPreferencesUpdate
	): Promise<RoomArrangement> {
		const arrangement = await this.updateArrangement(userId, expectedRevision, accessibleRooms, (item) =>
			item.updatePreferences(update)
		);

		return arrangement;
	}

	/**
	 * Legacy flat move without a client revision (PATCH /rooms). Last write wins: a concurrent write only causes a
	 * retry with the newly stored state. Works only while the user has no named groups.
	 */
	public async moveRoomToVisibleUngroupedPosition(
		userId: EntityId,
		roomId: EntityId,
		toPosition: number,
		accessibleRooms: RoomArrangementRoomInfo[]
	): Promise<void> {
		for (let attempt = 1; attempt <= MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS; attempt += 1) {
			const arrangement = await this.roomArrangementRepo.findOrCreateByUserId(userId);

			const changed = arrangement.moveUngroupedRoomToVisiblePosition(roomId, toPosition, accessibleRooms);
			if (!changed) {
				return;
			}

			const saved = await this.roomArrangementRepo.updateIfRevisionMatches(arrangement);
			if (saved) {
				return;
			}
		}

		throw new RoomArrangementConflictError(RoomArrangementConflictReason.REVISION);
	}

	public async deleteArrangements(userId: EntityId): Promise<EntityId[]> {
		const deletedIds = await this.roomArrangementRepo.deleteArrangements(userId);

		return deletedIds;
	}

	private async updateArrangement(
		userId: EntityId,
		expectedRevision: number,
		accessibleRooms: RoomArrangementRoomInfo[],
		command: RoomArrangementCommand
	): Promise<RoomArrangement> {
		const arrangement = await this.roomArrangementRepo.findOrCreateByUserId(userId);

		if (arrangement.revision !== expectedRevision) {
			throw new RoomArrangementConflictError(RoomArrangementConflictReason.REVISION);
		}

		const reconciled = arrangement.reconcile(accessibleRooms);
		const changed = command(arrangement);

		if (!reconciled && !changed) {
			return arrangement;
		}

		const saved = await this.roomArrangementRepo.updateIfRevisionMatches(arrangement);
		if (!saved) {
			throw new RoomArrangementConflictError(RoomArrangementConflictReason.REVISION);
		}

		return arrangement;
	}
}
