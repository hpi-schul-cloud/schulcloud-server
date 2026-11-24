import { BadRequestException } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	roomArrangementFactory,
	roomArrangementRoomInfoFactory,
	roomGroupPropsFactory,
} from '../../testing/room-arrangement.factory';
import {
	RoomArrangementConflictError,
	RoomArrangementInvalidGroupOrderError,
	RoomArrangementInvalidPositionError,
	RoomGroupNameDuplicateError,
	RoomGroupNameInvalidError,
	RoomGroupNotFoundError,
} from '../error';
import { RoomArrangementConflictReason, RoomGroupNameInvalidReason } from '../type';

const catchError = (act: () => unknown): unknown => {
	try {
		act();
	} catch (error) {
		return error;
	}

	return undefined;
};

describe('RoomArrangement', () => {
	describe('getAllRoomIds', () => {
		it('should return the ungrouped rooms followed by the rooms of every group in order', () => {
			const [r1, r2, r3, r4] = roomArrangementRoomInfoFactory.buildList(4);
			const groupA = roomGroupPropsFactory.build({ roomIds: [r3.id] });
			const groupB = roomGroupPropsFactory.build({ roomIds: [r4.id, r2.id] });
			const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [r1.id], groups: [groupA, groupB] });

			const result = arrangement.getAllRoomIds();

			expect(result).toEqual([r1.id, r3.id, r4.id, r2.id]);
		});
	});

	describe('constructor', () => {
		it('should not share arrays with the given props', () => {
			const room = roomArrangementRoomInfoFactory.build();
			const group = roomGroupPropsFactory.build({ roomIds: [] });
			const ungroupedRoomIds = [room.id];
			const arrangement = roomArrangementFactory.build({ ungroupedRoomIds, groups: [group] });

			arrangement.moveRoom({ roomId: room.id, sourceGroupId: null, targetGroupId: group.id, beforeRoomId: null }, [
				room,
			]);

			expect(ungroupedRoomIds).toEqual([room.id]);
			expect(group.roomIds).toEqual([]);
		});
	});

	describe('reconcile', () => {
		describe('when nothing changed', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(3);
				const group = roomGroupPropsFactory.build({ roomIds: [rooms[2].id] });
				const arrangement = roomArrangementFactory.build({
					ungroupedRoomIds: [rooms[1].id, rooms[0].id],
					groups: [group],
				});

				return { arrangement, rooms, group };
			};

			it('should return false and keep the order', () => {
				const { arrangement, rooms, group } = setup();

				const result = arrangement.reconcile(rooms);

				expect(result).toBe(false);
				expect(arrangement.ungroupedRoomIds).toEqual([rooms[1].id, rooms[0].id]);
				expect(arrangement.groups[0].roomIds).toEqual(group.roomIds);
			});
		});

		describe('when new rooms are accessible', () => {
			const setup = () => {
				const known = roomArrangementRoomInfoFactory.build();
				const older = roomArrangementRoomInfoFactory.build({ createdAt: new Date('2025-01-01T00:00:00Z') });
				const sameTime = new Date('2025-06-01T00:00:00Z');
				const tieHigh = roomArrangementRoomInfoFactory.build({ id: 'ffffffffffffffffffffffff', createdAt: sameTime });
				const tieLow = roomArrangementRoomInfoFactory.build({ id: '000000000000000000000000', createdAt: sameTime });
				const hidden = roomArrangementRoomInfoFactory.build({
					createdAt: new Date('2025-03-01T00:00:00Z'),
					isVisible: false,
				});
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [known.id] });

				return { arrangement, known, older, tieHigh, tieLow, hidden };
			};

			it('should append them to the ungrouped rooms ordered by creation date and id, including hidden ones', () => {
				const { arrangement, known, older, tieHigh, tieLow, hidden } = setup();

				const result = arrangement.reconcile([tieHigh, known, hidden, tieLow, older]);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([known.id, older.id, hidden.id, tieLow.id, tieHigh.id]);
			});
		});

		describe('when rooms are no longer accessible', () => {
			const setup = () => {
				const [kept, removed, keptInGroup, removedInGroup] = roomArrangementRoomInfoFactory.buildList(4);
				const archived = roomArrangementRoomInfoFactory.build({ isVisible: false });
				const group = roomGroupPropsFactory.build({ roomIds: [removedInGroup.id, archived.id, keptInGroup.id] });
				const arrangement = roomArrangementFactory.build({
					ungroupedRoomIds: [removed.id, kept.id],
					groups: [group],
				});

				return { arrangement, accessibleRooms: [kept, keptInGroup, archived], kept, keptInGroup, archived };
			};

			it('should remove them and keep hidden rooms in place', () => {
				const { arrangement, accessibleRooms, kept, keptInGroup, archived } = setup();

				const result = arrangement.reconcile(accessibleRooms);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([kept.id]);
				expect(arrangement.groups[0].roomIds).toEqual([archived.id, keptInGroup.id]);
			});
		});

		describe('when a room is stored twice', () => {
			const setup = () => {
				const [room, other] = roomArrangementRoomInfoFactory.buildList(2);
				const group = roomGroupPropsFactory.build({ roomIds: [room.id, other.id] });
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [room.id, room.id], groups: [group] });

				return { arrangement, room, other };
			};

			it('should keep only the first occurrence', () => {
				const { arrangement, room, other } = setup();

				const result = arrangement.reconcile([room, other]);

				expect(result).toBe(true);
				expect(arrangement.getAllRoomIds()).toEqual([room.id, other.id]);
				expect(arrangement.groups[0].roomIds).toEqual([other.id]);
			});
		});
	});

	describe('getVisibleArrangement', () => {
		const setup = () => {
			const [visible1, visible2, visible3] = roomArrangementRoomInfoFactory.buildList(3);
			const hidden = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const unknownId = new ObjectId().toHexString();
			const group = roomGroupPropsFactory.build({ collapsed: true, roomIds: [hidden.id, visible3.id] });
			const emptyGroup = roomGroupPropsFactory.build();
			const arrangement = roomArrangementFactory.build({
				revision: 7,
				ungroupedRoomIds: [visible2.id, unknownId, visible1.id],
				groups: [group, emptyGroup],
				confirmGroupDeletion: false,
			});

			return {
				arrangement,
				rooms: [visible1, visible2, visible3, hidden],
				visible1,
				visible2,
				visible3,
				group,
				emptyGroup,
			};
		};

		it('should only contain visible rooms in saved order and keep empty groups', () => {
			const { arrangement, rooms, visible1, visible2, visible3, group, emptyGroup } = setup();

			const result = arrangement.getVisibleArrangement(rooms);

			expect(result).toEqual({
				revision: arrangement.revision,
				ungroupedRoomIds: [visible2.id, visible1.id],
				groups: [
					{ id: group.id, name: group.name, collapsed: true, roomIds: [visible3.id] },
					{ id: emptyGroup.id, name: emptyGroup.name, collapsed: false, roomIds: [] },
				],
				confirmGroupDeletion: false,
				groupingHintDismissed: false,
			});
		});

		it('should flatten the visible rooms in overview order', () => {
			const { arrangement, rooms, visible1, visible2, visible3 } = setup();

			const result = arrangement.getVisibleRoomIdsInOrder(rooms);

			expect(result).toEqual([visible2.id, visible1.id, visible3.id]);
		});
	});

	describe('createGroup', () => {
		describe('when the name is valid', () => {
			const setup = () => {
				const existing = roomGroupPropsFactory.build({ name: 'Deutsch' });
				const arrangement = roomArrangementFactory.build({ groups: [existing] });
				const groupId = new ObjectId().toHexString();

				return { arrangement, existing, groupId };
			};

			it('should append an empty expanded group with the normalized name', () => {
				const { arrangement, existing, groupId } = setup();

				arrangement.createGroup(groupId, '  Informatik ');

				expect(arrangement.groups).toEqual([
					existing,
					{ id: groupId, name: 'Informatik', collapsed: false, roomIds: [] },
				]);
			});
		});

		describe('when the name is invalid', () => {
			it('should throw a name invalid error', () => {
				const arrangement = roomArrangementFactory.build();

				const act = () => arrangement.createGroup(new ObjectId().toHexString(), '   ');

				expect(act).toThrow(RoomGroupNameInvalidError);
				expect(arrangement.groups).toEqual([]);
			});
		});

		describe('when another group of the user has the same name (shared fixtures)', () => {
			it.each(['informatik', ' INFORMATIK ', 'Informatik'])('should reject %j', (name) => {
				const existing = roomGroupPropsFactory.build({ name: 'Informatik' });
				const arrangement = roomArrangementFactory.build({ groups: [existing] });

				const act = () => arrangement.createGroup(new ObjectId().toHexString(), name);

				expect(act).toThrow(RoomGroupNameDuplicateError);
				expect(arrangement.groups).toEqual([existing]);
			});
		});
	});

	describe('updateGroup', () => {
		const setup = () => {
			const room = roomArrangementRoomInfoFactory.build();
			const group = roomGroupPropsFactory.build({ name: 'Informatik', roomIds: [room.id] });
			const other = roomGroupPropsFactory.build({ name: 'Deutsch' });
			const arrangement = roomArrangementFactory.build({ groups: [group, other] });

			return { arrangement, group, other };
		};

		describe('when the group is renamed', () => {
			it('should store the normalized name and keep everything else', () => {
				const { arrangement, group, other } = setup();

				const result = arrangement.updateGroup(group.id, { name: ' Mathe ' });

				expect(result).toBe(true);
				expect(arrangement.groups).toEqual([{ ...group, name: 'Mathe' }, other]);
			});
		});

		describe('when the group is renamed to a different case of its own name (shared fixture)', () => {
			it('should accept the name', () => {
				const { arrangement, group } = setup();

				const result = arrangement.updateGroup(group.id, { name: 'informatik' });

				expect(result).toBe(true);
				expect(arrangement.groups[0].name).toBe('informatik');
			});
		});

		describe('when the name is unchanged', () => {
			it('should return false', () => {
				const { arrangement, group } = setup();

				const result = arrangement.updateGroup(group.id, { name: group.name });

				expect(result).toBe(false);
			});
		});

		describe('when the name belongs to another group', () => {
			it('should throw a duplicate error', () => {
				const { arrangement, group, other } = setup();

				const act = () => arrangement.updateGroup(group.id, { name: other.name.toUpperCase() });

				expect(act).toThrow(RoomGroupNameDuplicateError);
			});
		});

		describe('when the name is invalid', () => {
			it('should throw a name invalid error with the reason', () => {
				const { arrangement, group } = setup();

				const act = () => arrangement.updateGroup(group.id, { name: 'a'.repeat(101) });

				expect(catchError(act)).toMatchObject({
					details: { field: 'name', reason: RoomGroupNameInvalidReason.TOO_LONG },
				});
			});
		});

		describe('when the group is collapsed', () => {
			it('should change only the collapsed state', () => {
				const { arrangement, group, other } = setup();

				const result = arrangement.updateGroup(group.id, { collapsed: true });

				expect(result).toBe(true);
				expect(arrangement.groups).toEqual([{ ...group, collapsed: true }, other]);
			});
		});

		describe('when the collapsed state is unchanged', () => {
			it('should return false', () => {
				const { arrangement, group } = setup();

				const result = arrangement.updateGroup(group.id, { collapsed: group.collapsed });

				expect(result).toBe(false);
			});
		});

		describe('when the group does not exist', () => {
			it('should throw a not found error', () => {
				const { arrangement } = setup();

				const act = () => arrangement.updateGroup(new ObjectId().toHexString(), { collapsed: true });

				expect(act).toThrow(RoomGroupNotFoundError);
			});
		});
	});

	describe('deleteGroup', () => {
		const setup = () => {
			const [ungrouped, first, hidden, last] = roomArrangementRoomInfoFactory.buildList(4);
			const group = roomGroupPropsFactory.build({ roomIds: [first.id, hidden.id, last.id] });
			const other = roomGroupPropsFactory.build();
			const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [ungrouped.id], groups: [group, other] });

			return { arrangement, group, other, ungrouped, first, hidden, last };
		};

		describe('when the group exists', () => {
			it('should remove the group and append all its rooms to the ungrouped rooms in order', () => {
				const { arrangement, group, other, ungrouped, first, hidden, last } = setup();

				arrangement.deleteGroup(group.id, false);

				expect(arrangement.groups).toEqual([other]);
				expect(arrangement.ungroupedRoomIds).toEqual([ungrouped.id, first.id, hidden.id, last.id]);
				expect(arrangement.confirmGroupDeletion).toBe(true);
			});
		});

		describe('when future confirmations are disabled', () => {
			it('should also disable the confirmation', () => {
				const { arrangement, group } = setup();

				arrangement.deleteGroup(group.id, true);

				expect(arrangement.confirmGroupDeletion).toBe(false);
			});
		});

		describe('when the group does not exist', () => {
			it('should throw a not found error', () => {
				const { arrangement } = setup();

				const act = () => arrangement.deleteGroup(new ObjectId().toHexString(), true);

				expect(act).toThrow(RoomGroupNotFoundError);
				expect(arrangement.confirmGroupDeletion).toBe(true);
			});
		});
	});

	describe('reorderGroups', () => {
		const setup = () => {
			const groups = roomGroupPropsFactory.buildList(3);
			const arrangement = roomArrangementFactory.build({ groups });

			return { arrangement, groups };
		};

		describe('when the order is a permutation', () => {
			it('should reorder the groups', () => {
				const { arrangement, groups } = setup();

				const result = arrangement.reorderGroups([groups[2].id, groups[0].id, groups[1].id]);

				expect(result).toBe(true);
				expect(arrangement.groups).toEqual([groups[2], groups[0], groups[1]]);
			});
		});

		describe('when the order is unchanged', () => {
			it('should return false', () => {
				const { arrangement, groups } = setup();

				const result = arrangement.reorderGroups(groups.map((group) => group.id));

				expect(result).toBe(false);
			});
		});

		describe('when the order is not an exact permutation', () => {
			it.each([
				['an id is omitted', (ids: string[]) => [ids[0], ids[1]]],
				['an id is duplicated', (ids: string[]) => [ids[0], ids[1], ids[1]]],
				['an id is unknown', (ids: string[]) => [ids[0], ids[1], new ObjectId().toHexString()]],
				['an id is added', (ids: string[]) => [...ids, new ObjectId().toHexString()]],
			])('should throw an invalid group order error when %s', (_description, buildIds) => {
				const { arrangement, groups } = setup();
				const groupIds = buildIds(groups.map((group) => group.id));

				const act = () => arrangement.reorderGroups(groupIds);

				expect(act).toThrow(RoomArrangementInvalidGroupOrderError);
				expect(arrangement.groups).toEqual(groups);
			});
		});
	});

	describe('moveRoom', () => {
		const setup = () => {
			const [u1, u2, u3, g1, g2, g3] = roomArrangementRoomInfoFactory.buildList(6);
			const hiddenUngrouped = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const hiddenGrouped = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const group = roomGroupPropsFactory.build({ roomIds: [g1.id, hiddenGrouped.id, g2.id, g3.id] });
			const emptyGroup = roomGroupPropsFactory.build();
			const arrangement = roomArrangementFactory.build({
				ungroupedRoomIds: [u1.id, hiddenUngrouped.id, u2.id, u3.id],
				groups: [group, emptyGroup],
			});
			const rooms = [u1, u2, u3, g1, g2, g3, hiddenUngrouped, hiddenGrouped];

			return { arrangement, rooms, group, emptyGroup, u1, u2, u3, g1, g2, g3, hiddenUngrouped, hiddenGrouped };
		};

		describe('when a room is reordered within the ungrouped rooms', () => {
			it('should insert it before the anchor and keep hidden rooms in place', () => {
				const { arrangement, rooms, u1, u2, u3, hiddenUngrouped } = setup();

				const result = arrangement.moveRoom(
					{ roomId: u3.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: u1.id },
					rooms
				);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([u3.id, u1.id, hiddenUngrouped.id, u2.id]);
			});
		});

		describe('when a room is moved to the end of its own section', () => {
			it('should append it to the stored section', () => {
				const { arrangement, rooms, group, g1, g2, g3, hiddenGrouped } = setup();

				const result = arrangement.moveRoom(
					{ roomId: g1.id, sourceGroupId: group.id, targetGroupId: group.id, beforeRoomId: null },
					rooms
				);

				expect(result).toBe(true);
				expect(arrangement.groups[0].roomIds).toEqual([hiddenGrouped.id, g2.id, g3.id, g1.id]);
			});
		});

		describe('when a room is moved to the same position', () => {
			it('should return false', () => {
				const { arrangement, rooms, u2, u3 } = setup();

				const result = arrangement.moveRoom(
					{ roomId: u2.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: u3.id },
					rooms
				);

				expect(result).toBe(false);
			});
		});

		describe('when a room is assigned to a group', () => {
			it('should remove it from the ungrouped rooms and insert it into the group', () => {
				const { arrangement, rooms, group, u1, u2, u3, g1, g2, g3, hiddenUngrouped, hiddenGrouped } = setup();

				const result = arrangement.moveRoom(
					{ roomId: u2.id, sourceGroupId: null, targetGroupId: group.id, beforeRoomId: g2.id },
					rooms
				);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([u1.id, hiddenUngrouped.id, u3.id]);
				expect(arrangement.groups[0].roomIds).toEqual([g1.id, hiddenGrouped.id, u2.id, g2.id, g3.id]);
			});
		});

		describe('when a room is moved into an empty group', () => {
			it('should append it to the group', () => {
				const { arrangement, rooms, group, emptyGroup, g3 } = setup();

				arrangement.moveRoom(
					{ roomId: g3.id, sourceGroupId: group.id, targetGroupId: emptyGroup.id, beforeRoomId: null },
					rooms
				);

				expect(arrangement.groups[1].roomIds).toEqual([g3.id]);
			});
		});

		describe('when a room is moved back to the ungrouped rooms', () => {
			it('should remove it from the group and append it to the ungrouped rooms', () => {
				const { arrangement, rooms, group, u1, u2, u3, g1, g2, g3, hiddenUngrouped, hiddenGrouped } = setup();

				arrangement.moveRoom(
					{ roomId: g1.id, sourceGroupId: group.id, targetGroupId: null, beforeRoomId: null },
					rooms
				);

				expect(arrangement.ungroupedRoomIds).toEqual([u1.id, hiddenUngrouped.id, u2.id, u3.id, g1.id]);
				expect(arrangement.groups[0].roomIds).toEqual([hiddenGrouped.id, g2.id, g3.id]);
			});
		});

		describe('when the source group is unknown', () => {
			it('should throw a not found error', () => {
				const { arrangement, rooms, u1 } = setup();

				const act = () =>
					arrangement.moveRoom(
						{ roomId: u1.id, sourceGroupId: new ObjectId().toHexString(), targetGroupId: null, beforeRoomId: null },
						rooms
					);

				expect(act).toThrow(RoomGroupNotFoundError);
			});
		});

		describe('when the target group is unknown', () => {
			it('should throw a not found error', () => {
				const { arrangement, rooms, u1 } = setup();

				const act = () =>
					arrangement.moveRoom(
						{ roomId: u1.id, sourceGroupId: null, targetGroupId: new ObjectId().toHexString(), beforeRoomId: null },
						rooms
					);

				expect(act).toThrow(RoomGroupNotFoundError);
			});
		});

		describe('when the room is not visible', () => {
			it('should throw a state conflict', () => {
				const { arrangement, rooms, hiddenUngrouped } = setup();

				const act = () =>
					arrangement.moveRoom(
						{ roomId: hiddenUngrouped.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: null },
						rooms
					);

				expect(catchError(act)).toMatchObject({ code: 409, details: { reason: RoomArrangementConflictReason.STATE } });
			});
		});

		describe('when the room is not in the source section', () => {
			it('should throw a state conflict', () => {
				const { arrangement, rooms, group, u1 } = setup();

				const act = () =>
					arrangement.moveRoom(
						{ roomId: u1.id, sourceGroupId: group.id, targetGroupId: null, beforeRoomId: null },
						rooms
					);

				expect(catchError(act)).toMatchObject({ code: 409, details: { reason: RoomArrangementConflictReason.STATE } });
				expect(arrangement.ungroupedRoomIds[0]).toBe(u1.id);
			});
		});

		describe('when the anchor is the room itself', () => {
			it('should throw an invalid position error', () => {
				const { arrangement, rooms, u1 } = setup();

				const act = () =>
					arrangement.moveRoom({ roomId: u1.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: u1.id }, rooms);

				expect(act).toThrow(RoomArrangementInvalidPositionError);
			});
		});

		describe('when the anchor is not in the target section', () => {
			it('should throw an invalid position error', () => {
				const { arrangement, rooms, group, u1, u2 } = setup();

				const act = () =>
					arrangement.moveRoom(
						{ roomId: u1.id, sourceGroupId: null, targetGroupId: group.id, beforeRoomId: u2.id },
						rooms
					);

				expect(act).toThrow(RoomArrangementInvalidPositionError);
			});
		});

		describe('when the anchor is hidden', () => {
			it('should throw an invalid position error', () => {
				const { arrangement, rooms, u1, hiddenUngrouped } = setup();

				const act = () =>
					arrangement.moveRoom(
						{ roomId: u1.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: hiddenUngrouped.id },
						rooms
					);

				expect(act).toThrow(RoomArrangementInvalidPositionError);
			});
		});
	});

	describe('moveUngroupedRoomToVisiblePosition', () => {
		const setup = () => {
			const [r1, r2, r3] = roomArrangementRoomInfoFactory.buildList(3);
			const hidden = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [r1.id, hidden.id, r2.id, r3.id] });
			const rooms = [r1, r2, r3, hidden];

			return { arrangement, rooms, r1, r2, r3, hidden };
		};

		describe('when the room is moved to the front', () => {
			it('should translate the visible position into an anchor', () => {
				const { arrangement, rooms, r1, r2, r3, hidden } = setup();

				const result = arrangement.moveUngroupedRoomToVisiblePosition(r3.id, 0, rooms);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([r3.id, r1.id, hidden.id, r2.id]);
			});
		});

		describe('when the room is moved to the last visible position', () => {
			it('should append it', () => {
				const { arrangement, rooms, r1, r2, r3, hidden } = setup();

				arrangement.moveUngroupedRoomToVisiblePosition(r1.id, 2, rooms);

				expect(arrangement.ungroupedRoomIds).toEqual([hidden.id, r2.id, r3.id, r1.id]);
			});
		});

		describe('when the position is unchanged', () => {
			it('should return false', () => {
				const { arrangement, rooms, r2 } = setup();

				const result = arrangement.moveUngroupedRoomToVisiblePosition(r2.id, 1, rooms);

				expect(result).toBe(false);
			});
		});

		describe('when the position is out of the visible range', () => {
			it.each([-1, 3])('should throw a bad request for position %d', (position) => {
				const { arrangement, rooms, r1 } = setup();

				const act = () => arrangement.moveUngroupedRoomToVisiblePosition(r1.id, position, rooms);

				expect(act).toThrow(BadRequestException);
			});
		});

		describe('when the room is not a visible ungrouped room', () => {
			it('should throw a bad request', () => {
				const { arrangement, rooms, hidden } = setup();

				const act = () => arrangement.moveUngroupedRoomToVisiblePosition(hidden.id, 0, rooms);

				expect(act).toThrow(BadRequestException);
			});
		});

		describe('when the user has named groups', () => {
			it('should throw a legacy move conflict', () => {
				const room = roomArrangementRoomInfoFactory.build();
				const group = roomGroupPropsFactory.build();
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [room.id], groups: [group] });

				const act = () => arrangement.moveUngroupedRoomToVisiblePosition(room.id, 0, [room]);

				expect(catchError(act)).toBeInstanceOf(RoomArrangementConflictError);
				expect(catchError(act)).toMatchObject({
					code: 409,
					details: { reason: RoomArrangementConflictReason.LEGACY_MOVE_WITH_GROUPS },
				});
			});
		});
	});

	describe('setAllGroupsCollapsed', () => {
		describe('when some groups differ', () => {
			it('should set the value on every group and return true', () => {
				const groups = [roomGroupPropsFactory.build({ collapsed: true }), roomGroupPropsFactory.build()];
				const arrangement = roomArrangementFactory.build({ groups });

				const result = arrangement.setAllGroupsCollapsed(true);

				expect(result).toBe(true);
				expect(arrangement.groups.map((group) => group.collapsed)).toEqual([true, true]);
				expect(arrangement.groups.map((group) => group.name)).toEqual(groups.map((group) => group.name));
			});
		});

		describe('when every group already has the value', () => {
			it('should return false', () => {
				const arrangement = roomArrangementFactory.build({ groups: roomGroupPropsFactory.buildList(2) });

				const result = arrangement.setAllGroupsCollapsed(false);

				expect(result).toBe(false);
			});
		});

		describe('when there are no groups', () => {
			it('should return false', () => {
				const arrangement = roomArrangementFactory.build();

				const result = arrangement.setAllGroupsCollapsed(true);

				expect(result).toBe(false);
			});
		});
	});

	describe('moveRoomsToSection', () => {
		const setup = () => {
			const [u1, u2, u3, g1, g2] = roomArrangementRoomInfoFactory.buildList(5);
			const hiddenUngrouped = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const hiddenGrouped = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const group = roomGroupPropsFactory.build({ roomIds: [g1.id, hiddenGrouped.id, g2.id] });
			const other = roomGroupPropsFactory.build();
			const arrangement = roomArrangementFactory.build({
				ungroupedRoomIds: [u1.id, hiddenUngrouped.id, u2.id, u3.id],
				groups: [group, other],
			});
			const rooms = [u1, u2, u3, g1, g2, hiddenUngrouped, hiddenGrouped];

			return { arrangement, rooms, group, other, u1, u2, u3, g1, g2, hiddenUngrouped, hiddenGrouped };
		};

		describe('when rooms from several sections are moved into a group', () => {
			it('should append them in the listed order and keep all other rooms in order', () => {
				const { arrangement, rooms, group, u1, u2, u3, g1, g2, hiddenUngrouped, hiddenGrouped } = setup();

				const result = arrangement.moveRoomsToSection([u3.id, g1.id, u1.id], group.id, rooms);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([hiddenUngrouped.id, u2.id]);
				expect(arrangement.groups[0].roomIds).toEqual([hiddenGrouped.id, g2.id, u3.id, g1.id, u1.id]);
				expect(arrangement.groups[1].roomIds).toEqual([]);
			});
		});

		describe('when rooms are moved to the ungrouped rooms', () => {
			it('should append them after hidden rooms', () => {
				const { arrangement, rooms, u1, u2, u3, g1, g2, hiddenUngrouped, hiddenGrouped } = setup();

				arrangement.moveRoomsToSection([g2.id, g1.id], null, rooms);

				expect(arrangement.ungroupedRoomIds).toEqual([u1.id, hiddenUngrouped.id, u2.id, u3.id, g2.id, g1.id]);
				expect(arrangement.groups[0].roomIds).toEqual([hiddenGrouped.id]);
			});
		});

		describe('when listed rooms are already in the target', () => {
			it('should move them to the end in the listed order', () => {
				const { arrangement, rooms, u1, u2, u3, hiddenUngrouped } = setup();

				const result = arrangement.moveRoomsToSection([u2.id, u1.id], null, rooms);

				expect(result).toBe(true);
				expect(arrangement.ungroupedRoomIds).toEqual([hiddenUngrouped.id, u3.id, u2.id, u1.id]);
			});
		});

		describe('when the result equals the current state', () => {
			it('should return false', () => {
				const { arrangement, rooms, group, g2 } = setup();

				const result = arrangement.moveRoomsToSection([g2.id], group.id, rooms);

				expect(result).toBe(false);
			});
		});

		describe('when the target group is unknown', () => {
			it('should throw a not found error and change nothing', () => {
				const { arrangement, rooms, u1 } = setup();
				const before = arrangement.getAllRoomIds();

				const act = () => arrangement.moveRoomsToSection([u1.id], new ObjectId().toHexString(), rooms);

				expect(act).toThrow(RoomGroupNotFoundError);
				expect(arrangement.getAllRoomIds()).toEqual(before);
			});
		});

		describe('when a listed room is not visible', () => {
			it('should throw a state conflict and change nothing', () => {
				const { arrangement, rooms, other, u1, hiddenGrouped } = setup();
				const before = arrangement.getAllRoomIds();

				const act = () => arrangement.moveRoomsToSection([u1.id, hiddenGrouped.id], other.id, rooms);

				expect(catchError(act)).toMatchObject({ code: 409, details: { reason: RoomArrangementConflictReason.STATE } });
				expect(arrangement.getAllRoomIds()).toEqual(before);
			});
		});
	});

	describe('updatePreferences', () => {
		describe('when only the grouping hint is given', () => {
			it('should change only the grouping hint', () => {
				const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: false, groupingHintDismissed: false });

				const result = arrangement.updatePreferences({ groupingHintDismissed: true });

				expect(result).toBe(true);
				expect(arrangement.groupingHintDismissed).toBe(true);
				expect(arrangement.confirmGroupDeletion).toBe(false);
			});
		});

		describe('when only the deletion confirmation is given', () => {
			it('should change only the deletion confirmation', () => {
				const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: true, groupingHintDismissed: true });

				const result = arrangement.updatePreferences({ confirmGroupDeletion: false });

				expect(result).toBe(true);
				expect(arrangement.confirmGroupDeletion).toBe(false);
				expect(arrangement.groupingHintDismissed).toBe(true);
			});
		});

		describe('when both values are unchanged', () => {
			it('should return false', () => {
				const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: true, groupingHintDismissed: true });

				const result = arrangement.updatePreferences({ confirmGroupDeletion: true, groupingHintDismissed: true });

				expect(result).toBe(false);
			});
		});

		describe('when no preference is given', () => {
			it('should return false', () => {
				const arrangement = roomArrangementFactory.build();

				const result = arrangement.updatePreferences({});

				expect(result).toBe(false);
			});
		});

		describe('when both values change', () => {
			it('should change both', () => {
				const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: true, groupingHintDismissed: false });

				const result = arrangement.updatePreferences({ confirmGroupDeletion: false, groupingHintDismissed: true });

				expect(result).toBe(true);
				expect(arrangement.getProps()).toEqual(
					expect.objectContaining({ confirmGroupDeletion: false, groupingHintDismissed: true })
				);
			});
		});
	});

	describe('setConfirmGroupDeletion', () => {
		describe('when the value changes', () => {
			it('should set it and return true', () => {
				const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: false });

				const result = arrangement.setConfirmGroupDeletion(true);

				expect(result).toBe(true);
				expect(arrangement.confirmGroupDeletion).toBe(true);
			});
		});

		describe('when the value is unchanged', () => {
			it('should return false', () => {
				const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: true });

				const result = arrangement.setConfirmGroupDeletion(true);

				expect(result).toBe(false);
			});
		});
	});

	describe('incrementRevision', () => {
		it('should increase the revision by one', () => {
			const arrangement = roomArrangementFactory.build({ revision: 3 });

			arrangement.incrementRevision();

			expect(arrangement.revision).toBe(4);
		});
	});
});
