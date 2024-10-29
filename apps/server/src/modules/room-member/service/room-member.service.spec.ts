import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { groupFactory, roleDtoFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { GroupService, GroupTypes } from '@src/modules/group';
import { RoleService } from '@src/modules/role';
import { roomFactory } from '@src/modules/room/testing';
import { RoomMemberAuthorizable } from '../do/room-member-authorizable.do';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { roomMemberFactory } from '../testing';
import { RoomMemberService } from './room-member.service';

describe('RoomMemberService', () => {
	let module: TestingModule;
	let service: RoomMemberService;
	let roomMemberRepo: DeepMocked<RoomMemberRepo>;
	let groupService: DeepMocked<GroupService>;
	let roleService: DeepMocked<RoleService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				RoomMemberService,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: RoomMemberRepo,
					useValue: createMock<RoomMemberRepo>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
			],
		}).compile();

		service = module.get<RoomMemberService>(RoomMemberService);
		roomMemberRepo = module.get(RoomMemberRepo);
		groupService = module.get(GroupService);
		roleService = module.get(RoleService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('addMembersToRoom', () => {
		describe('when room member does not exist', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				const group = groupFactory.build({ type: GroupTypes.ROOM });

				roomMemberRepo.findByRoomId.mockResolvedValue(null);
				groupService.createGroup.mockResolvedValue(group);
				groupService.addUserToGroup.mockResolvedValue();
				roomMemberRepo.save.mockResolvedValue();

				return {
					user,
					room,
				};
			};

			it('should create new room member when not exists', async () => {
				const { user, room } = setup();

				await service.addMembersToRoom(room.id, [{ userId: user.id, roleName: RoleName.ROOM_EDITOR }]);

				expect(roomMemberRepo.save).toHaveBeenCalled();
			});

			describe('when no user is provided', () => {
				it('should throw an exception', async () => {
					const { room } = setup();

					roomMemberRepo.findByRoomId.mockResolvedValue(null);

					await expect(service.addMembersToRoom(room.id, [])).rejects.toThrow();
				});
			});
		});

		describe('when room member exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const group = groupFactory.build({ type: GroupTypes.ROOM });
				const room = roomFactory.build();
				const roomMember = roomMemberFactory.build({ roomId: room.id, userGroupId: group.id });

				roomMemberRepo.findByRoomId.mockResolvedValue(roomMember);

				return {
					user,
					room,
					roomMember,
					group,
				};
			};

			it('should add user to existing room member', async () => {
				const { user, room, group } = setup();

				await service.addMembersToRoom(room.id, [{ userId: user.id, roleName: RoleName.ROOM_EDITOR }]);

				expect(groupService.addUsersToGroup).toHaveBeenCalledWith(group.id, [
					{ userId: user.id, roleName: RoleName.ROOM_EDITOR },
				]);
			});
		});
	});

	describe('removeMembersFromRoom', () => {
		describe('when room member does not exist', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomFactory.build();
				const group = groupFactory.build({ type: GroupTypes.ROOM });

				roomMemberRepo.findByRoomId.mockResolvedValue(null);
				groupService.createGroup.mockResolvedValue(group);
				groupService.addUserToGroup.mockResolvedValue();
				roomMemberRepo.save.mockResolvedValue();

				return {
					user,
					room,
				};
			};

			describe('when roomMember does not exist', () => {
				it('should throw an exception', async () => {
					const { room } = setup();
					roomMemberRepo.findByRoomId.mockResolvedValue(null);

					await expect(service.removeMembersFromRoom(room.id, [])).rejects.toThrowError(BadRequestException);
				});
			});
		});

		describe('when room member exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const group = groupFactory.build({ type: GroupTypes.ROOM });
				const room = roomFactory.build();
				const roomMember = roomMemberFactory.build({ roomId: room.id, userGroupId: group.id });

				roomMemberRepo.findByRoomId.mockResolvedValue(roomMember);
				groupService.findById.mockResolvedValue(group);

				return {
					user,
					room,
					roomMember,
					group,
				};
			};

			it('should remove room member', async () => {
				const { user, room, group } = setup();

				await service.removeMembersFromRoom(room.id, [user.id]);

				expect(groupService.removeUsersFromGroup).toHaveBeenCalledWith(group.id, [user.id]);
			});
		});
	});

	describe('deleteRoomMember', () => {
		describe('when room member does not exist', () => {
			const setup = () => {
				roomMemberRepo.findByRoomId.mockResolvedValue(null);
			};

			it('no nothing', async () => {
				setup();
				await service.deleteRoomMember('roomId');
				expect(groupService.delete).not.toHaveBeenCalled();
				expect(roomMemberRepo.delete).not.toHaveBeenCalled();
			});
		});

		describe('when room member exists', () => {
			const setup = () => {
				const group = groupFactory.build();
				const roomMember = roomMemberFactory.build({ userGroupId: group.id });
				roomMemberRepo.findByRoomId.mockResolvedValue(roomMember);
				groupService.findById.mockResolvedValue(group);

				return { roomMember, group };
			};

			it('should call delete group and room member', async () => {
				const { roomMember, group } = setup();
				await service.deleteRoomMember(roomMember.roomId);
				expect(groupService.delete).toHaveBeenCalledWith(group);
				expect(roomMemberRepo.delete).toHaveBeenCalledWith(roomMember);
			});
		});
	});

	describe('getRoomMemberAuthorizable', () => {
		const setup = () => {
			const roomId = 'room123';
			const userId = 'user456';
			const groupId = 'group789';
			const roleId = 'role101';

			const roomMember = roomMemberFactory.build({ roomId, userGroupId: groupId });
			const group = groupFactory.build({ id: groupId, users: [{ userId, roleId }] });
			const role = roleDtoFactory.build({ id: roleId });

			roomMemberRepo.findByRoomId.mockResolvedValue(roomMember);
			groupService.findById.mockResolvedValue(group);
			roleService.findByIds.mockResolvedValue([role]);

			return { roomId, userId, groupId, roleId, roomMember, group, role };
		};

		it('should return RoomMemberAuthorizable when room member exists', async () => {
			const { roomId, userId, roleId } = setup();

			const result = await service.getRoomMemberAuthorizable(roomId);

			expect(result).toBeInstanceOf(RoomMemberAuthorizable);
			expect(result.roomId).toBe(roomId);
			expect(result.members).toHaveLength(1);
			expect(result.members[0].userId).toBe(userId);
			expect(result.members[0].roles[0].id).toBe(roleId);
		});

		it('should return empty RoomMemberAuthorizable when room member not exists', async () => {
			const roomId = 'nonexistent';
			roomMemberRepo.findByRoomId.mockResolvedValue(null);

			const result = await service.getRoomMemberAuthorizable(roomId);

			expect(result).toBeInstanceOf(RoomMemberAuthorizable);
			expect(result.roomId).toBe(roomId);
			expect(result.members).toHaveLength(0);
		});
	});

	describe('getRoomMemberAuthorizablesByUserId', () => {
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
			const roomMembers = [
				roomMemberFactory.build({ roomId: roomId1, userGroupId: groupId1 }),
				roomMemberFactory.build({ roomId: roomId2, userGroupId: groupId2 }),
			];
			const roles = [roleDtoFactory.build({ id: roleId1 }), roleDtoFactory.build({ id: roleId2 })];

			groupService.findGroups.mockResolvedValue({ data: groups, total: groups.length });
			roomMemberRepo.findByGroupIds.mockResolvedValue(roomMembers);
			roleService.findByIds.mockResolvedValue(roles);

			return { userId, roomMembers, roles };
		};

		it('should return RoomMemberAuthorizables for user', async () => {
			const { userId, roomMembers, roles } = setup();

			const result = await service.getRoomMemberAuthorizablesByUserId(userId);

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(RoomMemberAuthorizable);
			expect(result[0].roomId).toBe(roomMembers[0].roomId);
			expect(result[0].members[0].userId).toBe(userId);
			expect(result[0].members[0].roles[0].id).toBe(roles[0].id);
			expect(result[1]).toBeInstanceOf(RoomMemberAuthorizable);
			expect(result[1].roomId).toBe(roomMembers[1].roomId);
			expect(result[1].members[0].userId).toBe(userId);
			expect(result[1].members[0].roles[0].id).toBe(roles[1].id);
		});

		it('should return empty array when no groups found', async () => {
			const { userId } = setup();
			groupService.findGroups.mockResolvedValue({ data: [], total: 0 });

			const result = await service.getRoomMemberAuthorizablesByUserId(userId);

			expect(result).toHaveLength(0);
		});
	});
});
