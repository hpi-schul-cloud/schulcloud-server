import { BadRequestException } from '@nestjs/common';
import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { isEqual } from 'lodash';
import { RoomArrangementConflictError } from '../error/room-arrangement-conflict.error';
import { RoomArrangementInvalidGroupOrderError } from '../error/room-arrangement-invalid-group-order.error';
import { RoomArrangementInvalidPositionError } from '../error/room-arrangement-invalid-position.error';
import { RoomGroupNameDuplicateError } from '../error/room-group-name-duplicate.error';
import { RoomGroupNotFoundError } from '../error/room-group-not-found.error';
import {
	RoomArrangementConflictReason,
	type RoomArrangementRoomInfo,
	type RoomGroupProps,
	type RoomGroupUpdate,
	type RoomPositionCommand,
} from '../type/room-arrangement';
import { type VisibleRoomArrangement } from '../type/visible-room-arrangement';
import { isSameRoomGroupName, normalizeRoomGroupName } from './room-group-name';

export interface RoomArrangementProps extends AuthorizableObject {
	id: EntityId;
	userId: EntityId;
	revision: number;
	ungroupedRoomIds: EntityId[];
	groups: RoomGroupProps[];
	confirmGroupDeletion: boolean;
}

const compareByCreatedAtAndId = (a: RoomArrangementRoomInfo, b: RoomArrangementRoomInfo): number => {
	const byCreatedAt = a.createdAt.getTime() - b.createdAt.getTime();
	if (byCreatedAt !== 0) {
		return byCreatedAt;
	}
	if (a.id === b.id) {
		return 0;
	}

	return a.id < b.id ? -1 : 1;
};

export class RoomArrangement extends DomainObject<RoomArrangementProps> {
	constructor(props: RoomArrangementProps) {
		super({
			...props,
			ungroupedRoomIds: [...props.ungroupedRoomIds],
			groups: props.groups.map((group) => {
				return { ...group, roomIds: [...group.roomIds] };
			}),
		});
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get revision(): number {
		return this.props.revision;
	}

	get ungroupedRoomIds(): EntityId[] {
		return [...this.props.ungroupedRoomIds];
	}

	get groups(): RoomGroupProps[] {
		return this.props.groups.map((group) => {
			return { ...group, roomIds: [...group.roomIds] };
		});
	}

	get confirmGroupDeletion(): boolean {
		return this.props.confirmGroupDeletion;
	}

	public hasGroups(): boolean {
		return this.props.groups.length > 0;
	}

	public incrementRevision(): void {
		this.props.revision += 1;
	}

	/** All stored room ids: ungrouped first, then every group in order. */
	public getAllRoomIds(): EntityId[] {
		const roomIds = [...this.props.ungroupedRoomIds, ...this.props.groups.flatMap((group) => group.roomIds)];

		return roomIds;
	}

	/**
	 * Removes rooms that no longer exist or that the user is no longer a member of, removes duplicates
	 * and appends newly accessible rooms to the ungrouped rooms (oldest first). Hidden rooms are kept.
	 * Returns whether anything changed.
	 */
	public reconcile(accessibleRooms: RoomArrangementRoomInfo[]): boolean {
		const accessibleRoomIds = new Set(accessibleRooms.map((room) => room.id));
		const knownRoomIds = new Set<EntityId>();
		const keepRoom = (roomId: EntityId): boolean => {
			if (!accessibleRoomIds.has(roomId) || knownRoomIds.has(roomId)) {
				return false;
			}
			knownRoomIds.add(roomId);

			return true;
		};

		const ungroupedRoomIds = this.props.ungroupedRoomIds.filter(keepRoom);
		const groupRoomIds = this.props.groups.map((group) => group.roomIds.filter(keepRoom));

		const newRooms = [...accessibleRooms].filter((room) => !knownRoomIds.has(room.id)).sort(compareByCreatedAtAndId);
		newRooms.forEach((room) => {
			if (keepRoom(room.id)) {
				ungroupedRoomIds.push(room.id);
			}
		});

		const changed =
			!isEqual(ungroupedRoomIds, this.props.ungroupedRoomIds) ||
			this.props.groups.some((group, index) => !isEqual(groupRoomIds[index], group.roomIds));

		if (changed) {
			this.props.ungroupedRoomIds = ungroupedRoomIds;
			this.props.groups.forEach((group, index) => {
				group.roomIds = groupRoomIds[index];
			});
		}

		return changed;
	}

	public getVisibleArrangement(rooms: RoomArrangementRoomInfo[]): VisibleRoomArrangement {
		const visibleRoomIds = this.getVisibleRoomIdSet(rooms);
		const isVisible = (roomId: EntityId): boolean => visibleRoomIds.has(roomId);

		const visibleArrangement: VisibleRoomArrangement = {
			revision: this.props.revision,
			ungroupedRoomIds: this.props.ungroupedRoomIds.filter(isVisible),
			groups: this.props.groups.map((group) => {
				return {
					id: group.id,
					name: group.name,
					collapsed: group.collapsed,
					roomIds: group.roomIds.filter(isVisible),
				};
			}),
			confirmGroupDeletion: this.props.confirmGroupDeletion,
		};

		return visibleArrangement;
	}

	/** Visible room ids in overview order: ungrouped first, then every group in order. */
	public getVisibleRoomIdsInOrder(rooms: RoomArrangementRoomInfo[]): EntityId[] {
		const visibleRoomIds = this.getVisibleRoomIdSet(rooms);
		const orderedRoomIds = this.getAllRoomIds().filter((roomId) => visibleRoomIds.has(roomId));

		return orderedRoomIds;
	}

	public createGroup(groupId: EntityId, rawName: string): void {
		const name = normalizeRoomGroupName(rawName);
		this.checkNameIsUnique(name);

		this.props.groups.push({ id: groupId, name, collapsed: false, roomIds: [] });
	}

	public updateGroup(groupId: EntityId, update: RoomGroupUpdate): boolean {
		const group = this.getGroupOrFail(groupId);
		let changed = false;

		if (update.name !== undefined) {
			const name = normalizeRoomGroupName(update.name);
			this.checkNameIsUnique(name, groupId);
			if (name !== group.name) {
				group.name = name;
				changed = true;
			}
		}

		if (typeof update.collapsed === 'boolean' && update.collapsed !== group.collapsed) {
			group.collapsed = update.collapsed;
			changed = true;
		}

		return changed;
	}

	public deleteGroup(groupId: EntityId, disableFutureConfirmation: boolean): void {
		const group = this.getGroupOrFail(groupId);

		this.props.groups = this.props.groups.filter((item) => item.id !== groupId);
		this.props.ungroupedRoomIds.push(...group.roomIds);

		if (disableFutureConfirmation) {
			this.props.confirmGroupDeletion = false;
		}
	}

	public reorderGroups(groupIds: EntityId[]): boolean {
		const currentGroupIds = this.props.groups.map((group) => group.id);
		const isPermutation =
			groupIds.length === currentGroupIds.length &&
			new Set(groupIds).size === groupIds.length &&
			groupIds.every((groupId) => currentGroupIds.includes(groupId));

		if (!isPermutation) {
			throw new RoomArrangementInvalidGroupOrderError();
		}

		if (isEqual(groupIds, currentGroupIds)) {
			return false;
		}

		this.props.groups = groupIds.map((groupId) => this.getGroupOrFail(groupId));

		return true;
	}

	public moveRoom(command: RoomPositionCommand, rooms: RoomArrangementRoomInfo[]): boolean {
		const { roomId, sourceGroupId, targetGroupId, beforeRoomId } = command;
		const sourceRoomIds = this.getSectionRoomIds(sourceGroupId);
		const targetRoomIds = this.getSectionRoomIds(targetGroupId);
		const visibleRoomIds = this.getVisibleRoomIdSet(rooms);

		if (!visibleRoomIds.has(roomId) || !sourceRoomIds.includes(roomId)) {
			throw new RoomArrangementConflictError(RoomArrangementConflictReason.STATE);
		}

		if (
			beforeRoomId !== null &&
			(beforeRoomId === roomId || !visibleRoomIds.has(beforeRoomId) || !targetRoomIds.includes(beforeRoomId))
		) {
			throw new RoomArrangementInvalidPositionError();
		}

		const previousSourceRoomIds = [...sourceRoomIds];
		const previousTargetRoomIds = [...targetRoomIds];

		this.moveRoomBefore(sourceRoomIds, targetRoomIds, roomId, beforeRoomId);

		const changed = !isEqual(previousSourceRoomIds, sourceRoomIds) || !isEqual(previousTargetRoomIds, targetRoomIds);

		return changed;
	}

	/**
	 * Legacy flat move (PATCH /rooms): the position is an index into the visible ungrouped rooms.
	 * It is translated into an anchor so that hidden rooms keep their place.
	 */
	public moveUngroupedRoomToVisiblePosition(
		roomId: EntityId,
		toPosition: number,
		rooms: RoomArrangementRoomInfo[]
	): boolean {
		if (this.hasGroups()) {
			throw new RoomArrangementConflictError(RoomArrangementConflictReason.LEGACY_MOVE_WITH_GROUPS);
		}

		const visibleRoomIds = this.getVisibleRoomIdSet(rooms);
		const visibleUngroupedRoomIds = this.props.ungroupedRoomIds.filter((id) => visibleRoomIds.has(id));

		if (toPosition < 0 || toPosition >= visibleUngroupedRoomIds.length) {
			throw new BadRequestException(`Invalid position ${toPosition} for room arrangement of user '${this.userId}'`);
		}

		if (!visibleUngroupedRoomIds.includes(roomId)) {
			throw new BadRequestException(`Room with ID ${roomId} not found in arrangement of user '${this.userId}'`);
		}

		const remainingRoomIds = visibleUngroupedRoomIds.filter((id) => id !== roomId);
		const beforeRoomId = remainingRoomIds[Math.trunc(toPosition)] ?? null;
		const previousRoomIds = [...this.props.ungroupedRoomIds];

		this.moveRoomBefore(this.props.ungroupedRoomIds, this.props.ungroupedRoomIds, roomId, beforeRoomId);

		const changed = !isEqual(previousRoomIds, this.props.ungroupedRoomIds);

		return changed;
	}

	public setConfirmGroupDeletion(confirmGroupDeletion: boolean): boolean {
		if (this.props.confirmGroupDeletion === confirmGroupDeletion) {
			return false;
		}

		this.props.confirmGroupDeletion = confirmGroupDeletion;

		return true;
	}

	private moveRoomBefore(
		sourceRoomIds: EntityId[],
		targetRoomIds: EntityId[],
		roomId: EntityId,
		beforeRoomId: EntityId | null
	): void {
		sourceRoomIds.splice(sourceRoomIds.indexOf(roomId), 1);

		if (beforeRoomId === null) {
			targetRoomIds.push(roomId);
		} else {
			targetRoomIds.splice(targetRoomIds.indexOf(beforeRoomId), 0, roomId);
		}
	}

	private getSectionRoomIds(groupId: EntityId | null): EntityId[] {
		const roomIds = groupId === null ? this.props.ungroupedRoomIds : this.getGroupOrFail(groupId).roomIds;

		return roomIds;
	}

	private getGroupOrFail(groupId: EntityId): RoomGroupProps {
		const group = this.props.groups.find((item) => item.id === groupId);

		if (!group) {
			throw new RoomGroupNotFoundError();
		}

		return group;
	}

	private checkNameIsUnique(name: string, excludedGroupId?: EntityId): void {
		const isDuplicate = this.props.groups.some(
			(group) => group.id !== excludedGroupId && isSameRoomGroupName(group.name, name)
		);

		if (isDuplicate) {
			throw new RoomGroupNameDuplicateError();
		}
	}

	private getVisibleRoomIdSet(rooms: RoomArrangementRoomInfo[]): Set<EntityId> {
		const visibleRoomIds = new Set(rooms.filter((room) => room.isVisible).map((room) => room.id));

		return visibleRoomIds;
	}
}
