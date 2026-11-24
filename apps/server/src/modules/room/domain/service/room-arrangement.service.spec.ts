import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { RoomArrangementRepo } from '../../repo';
import {
	roomArrangementFactory,
	roomArrangementRoomInfoFactory,
	roomGroupPropsFactory,
} from '../../testing/room-arrangement.factory';
import { RoomArrangementConflictError, RoomArrangementInvalidPositionError, RoomGroupNotFoundError } from '../error';
import { RoomArrangementConflictReason } from '../type';
import { MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS, RoomArrangementService } from './room-arrangement.service';

describe(RoomArrangementService.name, () => {
	let module: TestingModule;
	let service: RoomArrangementService;
	let repo: DeepMocked<RoomArrangementRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomArrangementService,
				{ provide: RoomArrangementRepo, useValue: createMock<RoomArrangementRepo>() },
			],
		}).compile();

		service = module.get(RoomArrangementService);
		repo = module.get(RoomArrangementRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const conflict = (reason: RoomArrangementConflictReason) =>
		expect.objectContaining({ code: 409, details: { reason } }) as unknown;

	describe('getReconciledArrangement', () => {
		describe('when the arrangement is already reconciled', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: rooms.map((room) => room.id) });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { rooms, arrangement };
			};

			it('should return it without writing', async () => {
				const { rooms, arrangement } = setup();

				const result = await service.getReconciledArrangement(arrangement.userId, rooms);

				expect(result).toBe(arrangement);
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});

		describe('when reconciliation changes the arrangement', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [rooms[0].id] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { rooms, arrangement };
			};

			it('should write it once', async () => {
				const { rooms, arrangement } = setup();

				const result = await service.getReconciledArrangement(arrangement.userId, rooms);

				expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(1);
				expect(result.ungroupedRoomIds).toEqual(rooms.map((room) => room.id));
			});
		});

		describe('when the first write loses against a concurrent write', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				const stale = roomArrangementFactory.build({ ungroupedRoomIds: [] });
				const current = roomArrangementFactory.build({ id: stale.id, revision: 1, ungroupedRoomIds: [rooms[1].id] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(stale).mockResolvedValueOnce(current);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

				return { rooms, stale, current };
			};

			it('should reload and reconcile the current state', async () => {
				const { rooms, stale, current } = setup();

				const result = await service.getReconciledArrangement(stale.userId, rooms);

				expect(result).toBe(current);
				expect(result.ungroupedRoomIds).toEqual([rooms[1].id, rooms[0].id]);
				expect(repo.findOrCreateByUserId).toHaveBeenCalledTimes(2);
			});
		});

		describe('when every write loses', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(1);
				const arrangements = roomArrangementFactory.buildList(MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS);
				arrangements.forEach((arrangement) => {
					repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
					repo.updateIfRevisionMatches.mockResolvedValueOnce(false);
				});

				return { rooms, arrangements };
			};

			it('should stop after the maximum number of attempts and return the reconciled state', async () => {
				const { rooms, arrangements } = setup();

				const result = await service.getReconciledArrangement(arrangements[0].userId, rooms);

				expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS);
				expect(result).toBe(arrangements[MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS - 1]);
				expect(result.ungroupedRoomIds).toEqual([rooms[0].id]);
			});
		});
	});

	describe('createGroup', () => {
		describe('when the revision matches', () => {
			const setup = () => {
				const arrangement = roomArrangementFactory.build({ revision: 2 });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { arrangement };
			};

			it('should create the group and write the arrangement', async () => {
				const { arrangement } = setup();

				const result = await service.createGroup(arrangement.userId, 2, [], 'Informatik');

				expect(result.arrangement.groups).toEqual([
					{ id: result.createdGroupId, name: 'Informatik', collapsed: false, roomIds: [] },
				]);
				expect(ObjectId.isValid(result.createdGroupId)).toBe(true);
				expect(repo.updateIfRevisionMatches).toHaveBeenCalledWith(arrangement);
			});
		});

		describe('when the revision is stale', () => {
			const setup = () => {
				const arrangement = roomArrangementFactory.build({ revision: 3 });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { arrangement };
			};

			it('should throw a revision conflict without writing', async () => {
				const { arrangement } = setup();

				const promise = service.createGroup(arrangement.userId, 2, [], 'Informatik');

				await expect(promise).rejects.toThrow(RoomArrangementConflictError);
				await expect(promise).rejects.toEqual(conflict(RoomArrangementConflictReason.REVISION));
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});

		describe('when the compare-and-swap write misses', () => {
			const setup = () => {
				const arrangement = roomArrangementFactory.build();
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(false);

				return { arrangement };
			};

			it('should throw a revision conflict', async () => {
				const { arrangement } = setup();

				const promise = service.createGroup(arrangement.userId, 0, [], 'Informatik');

				await expect(promise).rejects.toEqual(conflict(RoomArrangementConflictReason.REVISION));
			});
		});
	});

	describe('updateGroup', () => {
		describe('when nothing changes', () => {
			const setup = () => {
				const group = roomGroupPropsFactory.build();
				const arrangement = roomArrangementFactory.build({ groups: [group] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { arrangement, group };
			};

			it('should return the arrangement without writing', async () => {
				const { arrangement, group } = setup();

				const result = await service.updateGroup(arrangement.userId, 0, [], group.id, {
					name: group.name,
					collapsed: group.collapsed,
				});

				expect(result.revision).toBe(0);
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});

		describe('when reconciliation changes the arrangement of a no-op command', () => {
			const setup = () => {
				const group = roomGroupPropsFactory.build();
				const room = roomArrangementRoomInfoFactory.build();
				const arrangement = roomArrangementFactory.build({ groups: [group] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { arrangement, group, room };
			};

			it('should write the reconciled arrangement', async () => {
				const { arrangement, group, room } = setup();

				await service.updateGroup(arrangement.userId, 0, [room], group.id, { collapsed: group.collapsed });

				expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(1);
			});
		});

		describe('when the group does not exist', () => {
			const setup = () => {
				const arrangement = roomArrangementFactory.build();
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { arrangement };
			};

			it('should throw a not found error', async () => {
				const { arrangement } = setup();

				const promise = service.updateGroup(arrangement.userId, 0, [], new ObjectId().toHexString(), {
					collapsed: true,
				});

				await expect(promise).rejects.toThrow(RoomGroupNotFoundError);
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});
	});

	describe('deleteGroup', () => {
		const setup = () => {
			const room = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const group = roomGroupPropsFactory.build({ roomIds: [room.id] });
			const arrangement = roomArrangementFactory.build({ groups: [group] });
			repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
			repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

			return { arrangement, group, room };
		};

		it('should delete the group, release its rooms and save the preference in one write', async () => {
			const { arrangement, group, room } = setup();

			const result = await service.deleteGroup(arrangement.userId, 0, [room], group.id, true);

			expect(result.groups).toEqual([]);
			expect(result.ungroupedRoomIds).toEqual([room.id]);
			expect(result.confirmGroupDeletion).toBe(false);
			expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(1);
		});
	});

	describe('reorderGroups', () => {
		const setup = () => {
			const groups = roomGroupPropsFactory.buildList(2);
			const arrangement = roomArrangementFactory.build({ groups });
			repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
			repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

			return { arrangement, groups };
		};

		it('should reorder the groups', async () => {
			const { arrangement, groups } = setup();

			const result = await service.reorderGroups(arrangement.userId, 0, [], [groups[1].id, groups[0].id]);

			expect(result.groups.map((group) => group.id)).toEqual([groups[1].id, groups[0].id]);
		});
	});

	describe('moveRoom', () => {
		describe('when the anchor is a room that only became accessible now', () => {
			const setup = () => {
				const [room, newRoom] = roomArrangementRoomInfoFactory.buildList(2);
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [room.id] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { arrangement, room, newRoom };
			};

			it('should reconcile before applying the move', async () => {
				const { arrangement, room, newRoom } = setup();

				const result = await service.moveRoom(arrangement.userId, 0, [room, newRoom], {
					roomId: room.id,
					sourceGroupId: null,
					targetGroupId: null,
					beforeRoomId: null,
				});

				expect(result.ungroupedRoomIds).toEqual([newRoom.id, room.id]);
			});
		});

		describe('when the anchor is invalid', () => {
			const setup = () => {
				const room = roomArrangementRoomInfoFactory.build();
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: [room.id] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { arrangement, room };
			};

			it('should throw an invalid position error without writing', async () => {
				const { arrangement, room } = setup();

				const promise = service.moveRoom(arrangement.userId, 0, [room], {
					roomId: room.id,
					sourceGroupId: null,
					targetGroupId: null,
					beforeRoomId: room.id,
				});

				await expect(promise).rejects.toThrow(RoomArrangementInvalidPositionError);
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});
	});

	describe('setAllGroupsCollapsed', () => {
		describe('when nothing changes', () => {
			const setup = () => {
				const arrangement = roomArrangementFactory.build({
					groups: [roomGroupPropsFactory.build({ collapsed: true })],
				});
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { arrangement };
			};

			it('should not write', async () => {
				const { arrangement } = setup();

				const result = await service.setAllGroupsCollapsed(arrangement.userId, 0, [], true);

				expect(result.revision).toBe(0);
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});

		describe('when groups change', () => {
			const setup = () => {
				const arrangement = roomArrangementFactory.build({ groups: roomGroupPropsFactory.buildList(2) });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { arrangement };
			};

			it('should write once', async () => {
				const { arrangement } = setup();

				const result = await service.setAllGroupsCollapsed(arrangement.userId, 0, [], true);

				expect(result.groups.every((group) => group.collapsed)).toBe(true);
				expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('moveRoomsToSection', () => {
		describe('when the revision is stale', () => {
			const setup = () => {
				const room = roomArrangementRoomInfoFactory.build();
				const arrangement = roomArrangementFactory.build({ revision: 2, ungroupedRoomIds: [room.id] });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { arrangement, room };
			};

			it('should throw a revision conflict without writing', async () => {
				const { arrangement, room } = setup();

				const promise = service.moveRoomsToSection(arrangement.userId, 1, [room], [room.id], null);

				await expect(promise).rejects.toEqual(conflict(RoomArrangementConflictReason.REVISION));
				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});

		describe('when the rooms move', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				const group = roomGroupPropsFactory.build();
				const arrangement = roomArrangementFactory.build({
					ungroupedRoomIds: rooms.map((room) => room.id),
					groups: [group],
				});
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { arrangement, rooms, group };
			};

			it('should apply all moves in one write', async () => {
				const { arrangement, rooms, group } = setup();

				const result = await service.moveRoomsToSection(
					arrangement.userId,
					0,
					rooms,
					[rooms[1].id, rooms[0].id],
					group.id
				);

				expect(result.groups[0].roomIds).toEqual([rooms[1].id, rooms[0].id]);
				expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('setConfirmGroupDeletion', () => {
		const setup = () => {
			const arrangement = roomArrangementFactory.build({ confirmGroupDeletion: true });
			repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
			repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

			return { arrangement };
		};

		it('should change the preference', async () => {
			const { arrangement } = setup();

			const result = await service.setConfirmGroupDeletion(arrangement.userId, 0, [], false);

			expect(result.confirmGroupDeletion).toBe(false);
			expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(1);
		});
	});

	describe('moveRoomToVisibleUngroupedPosition', () => {
		describe('when the room moves', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: rooms.map((room) => room.id) });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);
				repo.updateIfRevisionMatches.mockResolvedValueOnce(true);

				return { rooms, arrangement };
			};

			it('should write the new order', async () => {
				const { rooms, arrangement } = setup();

				await service.moveRoomToVisibleUngroupedPosition(arrangement.userId, rooms[1].id, 0, rooms);

				expect(repo.updateIfRevisionMatches).toHaveBeenCalledWith(
					expect.objectContaining({ ungroupedRoomIds: [rooms[1].id, rooms[0].id] })
				);
			});
		});

		describe('when the position is unchanged', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				const arrangement = roomArrangementFactory.build({ ungroupedRoomIds: rooms.map((room) => room.id) });
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { rooms, arrangement };
			};

			it('should not write', async () => {
				const { rooms, arrangement } = setup();

				await service.moveRoomToVisibleUngroupedPosition(arrangement.userId, rooms[0].id, 0, rooms);

				expect(repo.updateIfRevisionMatches).not.toHaveBeenCalled();
			});
		});

		describe('when every write loses against concurrent writes', () => {
			const setup = () => {
				const rooms = roomArrangementRoomInfoFactory.buildList(2);
				for (let i = 0; i < MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS; i += 1) {
					repo.findOrCreateByUserId.mockResolvedValueOnce(
						roomArrangementFactory.build({ ungroupedRoomIds: rooms.map((room) => room.id) })
					);
					repo.updateIfRevisionMatches.mockResolvedValueOnce(false);
				}

				return { rooms };
			};

			it('should throw a revision conflict after the maximum number of attempts', async () => {
				const { rooms } = setup();

				const promise = service.moveRoomToVisibleUngroupedPosition(new ObjectId().toHexString(), rooms[1].id, 0, rooms);

				await expect(promise).rejects.toEqual(conflict(RoomArrangementConflictReason.REVISION));
				expect(repo.updateIfRevisionMatches).toHaveBeenCalledTimes(MAX_ROOM_ARRANGEMENT_WRITE_ATTEMPTS);
			});
		});

		describe('when the user has groups', () => {
			const setup = () => {
				const room = roomArrangementRoomInfoFactory.build();
				const arrangement = roomArrangementFactory.build({
					ungroupedRoomIds: [room.id],
					groups: [roomGroupPropsFactory.build()],
				});
				repo.findOrCreateByUserId.mockResolvedValueOnce(arrangement);

				return { room, arrangement };
			};

			it('should throw a legacy move conflict', async () => {
				const { room, arrangement } = setup();

				const promise = service.moveRoomToVisibleUngroupedPosition(arrangement.userId, room.id, 0, [room]);

				await expect(promise).rejects.toEqual(conflict(RoomArrangementConflictReason.LEGACY_MOVE_WITH_GROUPS));
			});
		});
	});

	describe('deleteArrangements', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const deletedIds = [new ObjectId().toHexString()];
			repo.deleteArrangements.mockResolvedValueOnce(deletedIds);

			return { userId, deletedIds };
		};

		it('should delete the arrangements of the user', async () => {
			const { userId, deletedIds } = setup();

			const result = await service.deleteArrangements(userId);

			expect(result).toEqual(deletedIds);
			expect(repo.deleteArrangements).toHaveBeenCalledWith(userId);
		});
	});
});
