import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { type RoomOperation, RoomOperationValues, RoomRule } from '@modules/room-membership/authorization/room.rule';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { type Room, RoomArrangementService, RoomService } from '../domain';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '../room.config';
import { roomFactory } from '../testing';
import { roomArrangementFactory, roomGroupPropsFactory } from '../testing/room-arrangement.factory';
import { RoomArrangementUc } from './room-arrangement.uc';

describe(RoomArrangementUc.name, () => {
	let module: TestingModule;
	let uc: RoomArrangementUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let roomService: DeepMocked<RoomService>;
	let roomArrangementService: DeepMocked<RoomArrangementService>;
	let roomRule: DeepMocked<RoomRule>;
	let config: RoomPublicApiConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomArrangementUc,
				{ provide: AuthorizationService, useValue: createMock<AuthorizationService>() },
				{ provide: RoomMembershipService, useValue: createMock<RoomMembershipService>() },
				{ provide: RoomService, useValue: createMock<RoomService>() },
				{ provide: RoomArrangementService, useValue: createMock<RoomArrangementService>() },
				{ provide: RoomRule, useValue: createMock<RoomRule>() },
				{ provide: ROOM_PUBLIC_API_CONFIG_TOKEN, useValue: new RoomPublicApiConfig() },
			],
		}).compile();

		uc = module.get(RoomArrangementUc);
		authorizationService = module.get(AuthorizationService);
		roomMembershipService = module.get(RoomMembershipService);
		roomService = module.get(RoomService);
		roomArrangementService = module.get(RoomArrangementService);
		roomRule = module.get(RoomRule);
		config = module.get(ROOM_PUBLIC_API_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		config.featureRoomGroupingEnabled = true;
		config.featureRoomArchiveEnabled = true;
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const buildRoomAuthorizable = (room: Room, userId: string, roleName: RoleName): RoomAuthorizable => {
		const role = roleDtoFactory.build({ name: roleName });

		return new RoomAuthorizable(room.id, [{ userId, roles: [role], userSchoolId: room.schoolId }], room.schoolId);
	};

	const setupRoomAccess = (rooms: Room[], userId: string, roleName = RoleName.ROOMOWNER): RoomAuthorizable[] => {
		const roomAuthorizables = rooms.map((room) => buildRoomAuthorizable(room, userId, roleName));
		roomMembershipService.getRoomAuthorizablesByUserId.mockResolvedValueOnce(roomAuthorizables);
		roomService.getRoomsByIds.mockResolvedValueOnce(rooms);

		return roomAuthorizables;
	};

	describe('getRoomsByUserArrangement', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const [first, second, grouped] = roomFactory.buildList(3);
			const archived = roomFactory.build({ archivedAt: new Date() });
			const roomAuthorizables = setupRoomAccess([first, second, grouped, archived], user.id);
			const group = roomGroupPropsFactory.build({ roomIds: [archived.id, grouped.id] });
			const arrangement = roomArrangementFactory.build({
				userId: user.id,
				ungroupedRoomIds: [second.id, first.id],
				groups: [group],
			});
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			roomArrangementService.getReconciledArrangement.mockResolvedValueOnce(arrangement);
			const allowedOperations = Object.fromEntries(RoomOperationValues.map((operation) => [operation, true])) as Record<
				RoomOperation,
				boolean
			>;
			roomRule.listAllowedOperations.mockReturnValue(allowedOperations);

			return { user, first, second, grouped, archived, roomAuthorizables, allowedOperations };
		};

		describe('when the archive feature is enabled', () => {
			it('should return the visible rooms flattened in arrangement order with their metadata', async () => {
				const { user, first, second, grouped, allowedOperations } = setup();

				const result = await uc.getRoomsByUserArrangement(user.id);

				expect(result).toEqual([
					{ room: second, allowedOperations, isLocked: false, totalMembers: 1 },
					{ room: first, allowedOperations, isLocked: false, totalMembers: 1 },
					{ room: grouped, allowedOperations, isLocked: false, totalMembers: 1 },
				]);
			});

			it('should reconcile with all member rooms, marking archived rooms as hidden', async () => {
				const { user, first, archived } = setup();

				await uc.getRoomsByUserArrangement(user.id);

				expect(roomArrangementService.getReconciledArrangement).toHaveBeenCalledWith(
					user.id,
					expect.arrayContaining([
						{ id: first.id, createdAt: first.createdAt, isVisible: true },
						{ id: archived.id, createdAt: archived.createdAt, isVisible: false },
					])
				);
			});
		});

		describe('when the archive feature is disabled', () => {
			it('should also return archived rooms', async () => {
				const { user, archived } = setup();
				config.featureRoomArchiveEnabled = false;

				const result = await uc.getRoomsByUserArrangement(user.id);

				expect(result.map((item) => item.room.id)).toContain(archived.id);
			});
		});

		describe('when a room has no owner', () => {
			it('should mark it as locked', async () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				setupRoomAccess([room], user.id, RoleName.ROOMADMIN);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomArrangementService.getReconciledArrangement.mockResolvedValueOnce(
					roomArrangementFactory.build({ ungroupedRoomIds: [room.id] })
				);

				const result = await uc.getRoomsByUserArrangement(user.id);

				expect(result[0].isLocked).toBe(true);
			});
		});
	});

	describe('moveRoomInUserArrangement', () => {
		describe('when the user may arrange the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				const [roomAuthorizable] = setupRoomAccess([room], user.id);
				roomMembershipService.getRoomAuthorizable.mockResolvedValueOnce(roomAuthorizable);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomRule.can.mockReturnValueOnce(true);

				return { user, room };
			};

			it('should move the room by its visible position', async () => {
				const { user, room } = setup();

				await uc.moveRoomInUserArrangement(user.id, room.id, 0);

				expect(roomArrangementService.moveRoomToVisibleUngroupedPosition).toHaveBeenCalledWith(user.id, room.id, 0, [
					{ id: room.id, createdAt: room.createdAt, isVisible: true },
				]);
			});
		});

		describe('when the user may not arrange the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				roomMembershipService.getRoomAuthorizable.mockResolvedValueOnce(
					buildRoomAuthorizable(room, user.id, RoleName.ROOMVIEWER)
				);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomRule.can.mockReturnValueOnce(false);

				return { user, room };
			};

			it('should throw a forbidden exception', async () => {
				const { user, room } = setup();

				await expect(uc.moveRoomInUserArrangement(user.id, room.id, 0)).rejects.toThrow(ForbiddenException);
				expect(roomArrangementService.moveRoomToVisibleUngroupedPosition).not.toHaveBeenCalled();
			});
		});
	});

	describe('when the grouping feature is disabled', () => {
		const userId = new ObjectId().toHexString();
		const groupId = new ObjectId().toHexString();

		it.each([
			['getArrangement', () => uc.getArrangement(userId)],
			['createGroup', () => uc.createGroup(userId, 0, 'Informatik')],
			['updateGroup', () => uc.updateGroup(userId, 0, groupId, { collapsed: true })],
			['deleteGroup', () => uc.deleteGroup(userId, 0, groupId, false)],
			['updateGroupOrder', () => uc.updateGroupOrder(userId, 0, [groupId])],
			[
				'moveRoomToPosition',
				() =>
					uc.moveRoomToPosition(userId, 0, {
						roomId: groupId,
						sourceGroupId: null,
						targetGroupId: null,
						beforeRoomId: null,
					}),
			],
			['updatePreferences', () => uc.updatePreferences(userId, 0, false)],
		])('%s should throw a feature disabled exception', async (_name, act) => {
			config.featureRoomGroupingEnabled = false;

			await expect(act()).rejects.toThrow(new FeatureDisabledLoggableException('FEATURE_ROOM_GROUPING_ENABLED'));
			expect(roomMembershipService.getRoomAuthorizablesByUserId).not.toHaveBeenCalled();
		});
	});

	describe('getArrangement', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const room = roomFactory.build();
			const archived = roomFactory.build({ archivedAt: new Date() });
			setupRoomAccess([room, archived], user.id);
			const arrangement = roomArrangementFactory.build({
				userId: user.id,
				revision: 4,
				ungroupedRoomIds: [archived.id, room.id],
			});
			roomArrangementService.getReconciledArrangement.mockResolvedValueOnce(arrangement);

			return { user, room, arrangement };
		};

		it('should return the visible arrangement', async () => {
			const { user, room, arrangement } = setup();

			const result = await uc.getArrangement(user.id);

			expect(result).toEqual({
				revision: arrangement.revision,
				ungroupedRoomIds: [room.id],
				groups: [],
				confirmGroupDeletion: true,
			});
		});
	});

	describe('createGroup', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			setupRoomAccess([], user.id);
			const group = roomGroupPropsFactory.build();
			const arrangement = roomArrangementFactory.build({ userId: user.id, revision: 1, groups: [group] });
			roomArrangementService.createGroup.mockResolvedValueOnce({ arrangement, createdGroupId: group.id });

			return { user, group };
		};

		it('should return the arrangement with the id of the created group', async () => {
			const { user, group } = setup();

			const result = await uc.createGroup(user.id, 0, group.name);

			expect(roomArrangementService.createGroup).toHaveBeenCalledWith(user.id, 0, [], group.name);
			expect(result).toEqual(expect.objectContaining({ revision: 1, createdGroupId: group.id, groups: [group] }));
		});
	});

	describe('updateGroup', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			setupRoomAccess([], user.id);
			const group = roomGroupPropsFactory.build({ collapsed: true });
			roomArrangementService.updateGroup.mockResolvedValueOnce(roomArrangementFactory.build({ groups: [group] }));

			return { user, group };
		};

		it('should update the group', async () => {
			const { user, group } = setup();

			const result = await uc.updateGroup(user.id, 2, group.id, { collapsed: true });

			expect(roomArrangementService.updateGroup).toHaveBeenCalledWith(user.id, 2, [], group.id, { collapsed: true });
			expect(result.groups).toEqual([group]);
		});
	});

	describe('deleteGroup', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			setupRoomAccess([], user.id);
			const groupId = new ObjectId().toHexString();
			roomArrangementService.deleteGroup.mockResolvedValueOnce(roomArrangementFactory.build());

			return { user, groupId };
		};

		it('should delete the group', async () => {
			const { user, groupId } = setup();

			await uc.deleteGroup(user.id, 2, groupId, true);

			expect(roomArrangementService.deleteGroup).toHaveBeenCalledWith(user.id, 2, [], groupId, true);
		});
	});

	describe('updateGroupOrder', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			setupRoomAccess([], user.id);
			const groupIds = [new ObjectId().toHexString()];
			roomArrangementService.reorderGroups.mockResolvedValueOnce(roomArrangementFactory.build());

			return { user, groupIds };
		};

		it('should reorder the groups', async () => {
			const { user, groupIds } = setup();

			await uc.updateGroupOrder(user.id, 2, groupIds);

			expect(roomArrangementService.reorderGroups).toHaveBeenCalledWith(user.id, 2, [], groupIds);
		});
	});

	describe('updatePreferences', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			setupRoomAccess([], user.id);
			roomArrangementService.setConfirmGroupDeletion.mockResolvedValueOnce(
				roomArrangementFactory.build({ confirmGroupDeletion: false })
			);

			return { user };
		};

		it('should change the preference', async () => {
			const { user } = setup();

			const result = await uc.updatePreferences(user.id, 2, false);

			expect(roomArrangementService.setConfirmGroupDeletion).toHaveBeenCalledWith(user.id, 2, [], false);
			expect(result.confirmGroupDeletion).toBe(false);
		});
	});

	describe('moveRoomToPosition', () => {
		describe('when the user is not a member of the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				setupRoomAccess([], user.id);

				return { user, room };
			};

			it('should throw a forbidden exception', async () => {
				const { user, room } = setup();

				const promise = uc.moveRoomToPosition(user.id, 0, {
					roomId: room.id,
					sourceGroupId: null,
					targetGroupId: null,
					beforeRoomId: null,
				});

				await expect(promise).rejects.toThrow(ForbiddenException);
				expect(roomArrangementService.moveRoom).not.toHaveBeenCalled();
			});
		});

		describe('when the user may not arrange the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				setupRoomAccess([room], user.id, RoleName.ROOMADMIN);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomRule.can.mockReturnValueOnce(false);

				return { user, room };
			};

			it('should throw a forbidden exception', async () => {
				const { user, room } = setup();

				const promise = uc.moveRoomToPosition(user.id, 0, {
					roomId: room.id,
					sourceGroupId: null,
					targetGroupId: null,
					beforeRoomId: null,
				});

				await expect(promise).rejects.toThrow(ForbiddenException);
				expect(roomRule.can).toHaveBeenCalledWith('arrangeRooms', user, expect.objectContaining({ roomId: room.id }));
				expect(roomArrangementService.moveRoom).not.toHaveBeenCalled();
			});
		});

		describe('when the user may arrange the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				setupRoomAccess([room], user.id);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomRule.can.mockReturnValueOnce(true);
				const group = roomGroupPropsFactory.build({ roomIds: [room.id] });
				roomArrangementService.moveRoom.mockResolvedValueOnce(roomArrangementFactory.build({ groups: [group] }));
				const command = { roomId: room.id, sourceGroupId: null, targetGroupId: group.id, beforeRoomId: null };

				return { user, room, group, command };
			};

			it('should move the room', async () => {
				const { user, room, group, command } = setup();

				const result = await uc.moveRoomToPosition(user.id, 3, command);

				expect(roomArrangementService.moveRoom).toHaveBeenCalledWith(
					user.id,
					3,
					[{ id: room.id, createdAt: room.createdAt, isVisible: true }],
					command
				);
				expect(result.groups).toEqual([group]);
			});
		});
	});
});
