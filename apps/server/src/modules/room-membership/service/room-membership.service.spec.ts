import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { GroupService, GroupTypes } from '@modules/group';
import { RoleService } from '@modules/role';
import { roomFactory } from '@modules/room/testing';
import { BadRequestException } from '@nestjs/common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { groupFactory, roleDtoFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RoomService } from '@src/modules/room/domain';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';
import { RoomMembershipRepo } from '../repo/room-membership.repo';
import { roomMembershipFactory } from '../testing';
import { RoomMembershipService } from './room-membership.service';

describe('RoomMembershipService', () => {
	let module: TestingModule;
	let service: RoomMembershipService;
	let roomMembershipRepo: DeepMocked<RoomMembershipRepo>;
	let groupService: DeepMocked<GroupService>;
	let roleService: DeepMocked<RoleService>;
	let roomService: DeepMocked<RoomService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				RoomMembershipService,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: RoomMembershipRepo,
					useValue: createMock<RoomMembershipRepo>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
			],
		}).compile();

		service = module.get<RoomMembershipService>(RoomMembershipService);
		roomMembershipRepo = module.get(RoomMembershipRepo);
		groupService = module.get(GroupService);
		roleService = module.get(RoleService);
		roomService = module.get(RoomService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('addMembersToRoom', () => {
		describe('when roomMembership does not exist', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				const group = groupFactory.build({ type: GroupTypes.ROOM });

				roomMembershipRepo.findByRoomId.mockResolvedValue(null);
				groupService.createGroup.mockResolvedValue(group);
				groupService.addUserToGroup.mockResolvedValue();
				roomMembershipRepo.save.mockResolvedValue();
				roomService.getSingleRoom.mockResolvedValue(room);

				return {
					user,
					room,
				};
			};

			it('should create new roomMembership when not exists', async () => {
				const { user, room } = setup();

				await service.addMembersToRoom(room.id, [{ userId: user.id, roleName: RoleName.ROOMEDITOR }]);

				expect(roomMembershipRepo.save).toHaveBeenCalled();
			});

			it('should save the schoolId of the room in the roomMembership', async () => {
				const { user, room } = setup();

				await service.addMembersToRoom(room.id, [{ userId: user.id, roleName: RoleName.ROOMEDITOR }]);

				expect(roomMembershipRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						schoolId: room.schoolId,
					})
				);
			});

			describe('when no user is provided', () => {
				it('should throw an exception', async () => {
					const { room } = setup();

					roomMembershipRepo.findByRoomId.mockResolvedValue(null);

					await expect(service.addMembersToRoom(room.id, [])).rejects.toThrow();
				});
			});
		});

		describe('when roomMembership exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const group = groupFactory.build({ type: GroupTypes.ROOM });
				const room = roomFactory.build();
				const roomMembership = roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });

				roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);

				return {
					user,
					room,
					roomMembership,
					group,
				};
			};

			it('should add user to existing roomMembership', async () => {
				const { user, room, group } = setup();

				await service.addMembersToRoom(room.id, [{ userId: user.id, roleName: RoleName.ROOMEDITOR }]);

				expect(groupService.addUsersToGroup).toHaveBeenCalledWith(group.id, [
					{ userId: user.id, roleName: RoleName.ROOMEDITOR },
				]);
			});
		});
	});

	describe('removeMembersFromRoom', () => {
		describe('when roomMembership does not exist', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				const group = groupFactory.build({ type: GroupTypes.ROOM });

				roomMembershipRepo.findByRoomId.mockResolvedValue(null);
				groupService.createGroup.mockResolvedValue(group);
				groupService.addUserToGroup.mockResolvedValue();
				roomMembershipRepo.save.mockResolvedValue();

				return {
					user,
					room,
				};
			};

			describe('when roomMembership does not exist', () => {
				it('should throw an exception', async () => {
					const { room } = setup();
					roomMembershipRepo.findByRoomId.mockResolvedValue(null);

					await expect(service.removeMembersFromRoom(room.id, [])).rejects.toThrowError(BadRequestException);
				});
			});
		});

		describe('when roomMembership exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const group = groupFactory.build({ type: GroupTypes.ROOM });
				const room = roomFactory.build();
				const roomMembership = roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });

				roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);
				groupService.findById.mockResolvedValue(group);

				return {
					user,
					room,
					roomMembership,
					group,
				};
			};

			it('should remove roomMembership', async () => {
				const { user, room, group } = setup();

				await service.removeMembersFromRoom(room.id, [user.id]);

				expect(groupService.removeUsersFromGroup).toHaveBeenCalledWith(group.id, [user.id]);
			});
		});
	});

	describe('deleteRoomMembership', () => {
		describe('when roomMembership does not exist', () => {
			const setup = () => {
				roomMembershipRepo.findByRoomId.mockResolvedValue(null);
			};

			it('no nothing', async () => {
				setup();
				await service.deleteRoomMembership('roomId');
				expect(groupService.delete).not.toHaveBeenCalled();
				expect(roomMembershipRepo.delete).not.toHaveBeenCalled();
			});
		});

		describe('when roomMembership exists', () => {
			const setup = () => {
				const group = groupFactory.build();
				const roomMembership = roomMembershipFactory.build({ userGroupId: group.id });
				roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);
				groupService.findById.mockResolvedValue(group);

				return { roomMembership, group };
			};

			it('should call delete group and roomMembership', async () => {
				const { roomMembership, group } = setup();
				await service.deleteRoomMembership(roomMembership.roomId);
				expect(groupService.delete).toHaveBeenCalledWith(group);
				expect(roomMembershipRepo.delete).toHaveBeenCalledWith(roomMembership);
			});
		});
	});

	describe('getRoomMembershipAuthorizable', () => {
		const setup = () => {
			const roomId = 'room123';
			const userId = 'user456';
			const groupId = 'group789';
			const roleId = 'role101';

			const roomMembership = roomMembershipFactory.build({ roomId, userGroupId: groupId });
			const group = groupFactory.build({ id: groupId, users: [{ userId, roleId }] });
			const role = roleDtoFactory.build({ id: roleId });

			roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);
			groupService.findById.mockResolvedValue(group);
			roleService.findByIds.mockResolvedValue([role]);

			return { roomId, userId, groupId, roleId, roomMembership, group, role };
		};

		it('should return RoomMembershipAuthorizable when roomMembership exists', async () => {
			const { roomId, userId, roleId } = setup();

			const result = await service.getRoomMembershipAuthorizable(roomId);

			expect(result).toBeInstanceOf(RoomMembershipAuthorizable);
			expect(result.roomId).toBe(roomId);
			expect(result.members).toHaveLength(1);
			expect(result.members[0].userId).toBe(userId);
			expect(result.members[0].roles[0].id).toBe(roleId);
		});

		it('should return empty RoomMembershipAuthorizable when roomMembership not exists', async () => {
			const roomId = 'nonexistent';
			roomMembershipRepo.findByRoomId.mockResolvedValue(null);

			const result = await service.getRoomMembershipAuthorizable(roomId);

			expect(result).toBeInstanceOf(RoomMembershipAuthorizable);
			expect(result.roomId).toBe(roomId);
			expect(result.members).toHaveLength(0);
		});
	});

	describe('getRoomMembershipAuthorizablesByUserId', () => {
		const setup = () => {
			const userId = 'user123';
			const groupId1 = 'group456';
			const groupId2 = 'group789';
			const roomId1 = 'room111';
			const roomId2 = 'room222';
			const roleId1 = 'role333';
			const roleId2 = 'role444';

			const groups = [
				groupFactory.build({ id: groupId1, users: [{ userId, roleId: roleId1 }] }),
				groupFactory.build({ id: groupId2, users: [{ userId, roleId: roleId2 }] }),
			];
			const roomMemberships = [
				roomMembershipFactory.build({ roomId: roomId1, userGroupId: groupId1 }),
				roomMembershipFactory.build({ roomId: roomId2, userGroupId: groupId2 }),
			];
			const roles = [roleDtoFactory.build({ id: roleId1 }), roleDtoFactory.build({ id: roleId2 })];

			groupService.findGroups.mockResolvedValue({ data: groups, total: groups.length });
			roomMembershipRepo.findByGroupIds.mockResolvedValue(roomMemberships);
			roleService.findByIds.mockResolvedValue(roles);

			return { userId, roomMemberships, roles };
		};

		it('should return RoomMembershipAuthorizables for user', async () => {
			const { userId, roomMemberships, roles } = setup();

			const result = await service.getRoomMembershipAuthorizablesByUserId(userId);

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(RoomMembershipAuthorizable);
			expect(result[0].roomId).toBe(roomMemberships[0].roomId);
			expect(result[0].members[0].userId).toBe(userId);
			expect(result[0].members[0].roles[0].id).toBe(roles[0].id);
			expect(result[1]).toBeInstanceOf(RoomMembershipAuthorizable);
			expect(result[1].roomId).toBe(roomMemberships[1].roomId);
			expect(result[1].members[0].userId).toBe(userId);
			expect(result[1].members[0].roles[0].id).toBe(roles[1].id);
		});

		it('should return empty array when no groups found', async () => {
			const { userId } = setup();
			groupService.findGroups.mockResolvedValue({ data: [], total: 0 });

			const result = await service.getRoomMembershipAuthorizablesByUserId(userId);

			expect(result).toHaveLength(0);
		});
	});
});
