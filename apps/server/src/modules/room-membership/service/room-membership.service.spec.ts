import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes, GroupUser } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { roleDtoFactory, roleFactory } from '@modules/role/testing';
import { RoomService } from '@modules/room';
import { roomFactory } from '@modules/room/testing';
import { schoolFactory } from '@modules/school/testing';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { BadRequestException } from '@nestjs/common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { RoomAuthorizable } from '../do/room-authorizable.do';
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
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User] })],
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
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get<RoomMembershipService>(RoomMembershipService);
		roomMembershipRepo = module.get(RoomMembershipRepo);
		groupService = module.get(GroupService);
		roleService = module.get(RoleService);
		roomService = module.get(RoomService);
		userService = module.get(UserService);
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

			it('should throw an exception', async () => {
				const { room, user } = setup();

				roomMembershipRepo.findByRoomId.mockResolvedValue(null);

				await expect(service.addMembersToRoom(room.id, [user.id])).rejects.toThrow();
			});
		});

		describe('when roomMembership exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const school = schoolFactory.build();
				const group = groupFactory.build({ type: GroupTypes.ROOM, organizationId: school.id });
				const room = roomFactory.build({ schoolId: school.id });
				const roomMembership = roomMembershipFactory.build({
					roomId: room.id,
					userGroupId: group.id,
					schoolId: school.id,
				});

				roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);

				return {
					user,
					room,
					roomMembership,
					group,
				};
			};

			it('should add user to room as viewer', async () => {
				const { user, room, group } = setup();

				await service.addMembersToRoom(room.id, [user.id]);

				expect(groupService.addUsersToGroup).toHaveBeenCalledWith(group.id, [
					{ userId: user.id, roleName: RoleName.ROOMVIEWER },
				]);
			});

			it('should add user to room with specified role', async () => {
				const { user, room, group } = setup();

				await service.addMembersToRoom(room.id, [user.id], RoleName.ROOMEDITOR);

				expect(groupService.addUsersToGroup).toHaveBeenCalledWith(group.id, [
					{ userId: user.id, roleName: RoleName.ROOMEDITOR },
				]);
			});

			it('should add user to school', async () => {
				const { user, room } = setup();

				await service.addMembersToRoom(room.id, [user.id]);

				expect(userService.addSecondarySchoolToUsers).toHaveBeenCalledWith([user.id], room.schoolId);
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
			const setupGroupAndRoom = (schoolId: string) => {
				const group = groupFactory.build({ type: GroupTypes.ROOM });
				const room = roomFactory.build({ schoolId });
				const roomMembership = roomMembershipFactory.build({
					roomId: room.id,
					userGroupId: group.id,
					schoolId,
				});

				groupService.findById.mockResolvedValue(group);
				groupService.findGroups.mockResolvedValue({ total: 1, data: [group] });
				roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);

				return { group, room, roomMembership };
			};

			const mockGroupsAtSchoolAfterRemoval = (groups: Group[]) => {
				groupService.findGroups.mockResolvedValue({ total: groups.length, data: groups });
			};

			const setupRoomRoles = () => {
				const roomOwnerRole = roleFactory.buildWithId({ name: RoleName.ROOMOWNER });
				const roomEditorRole = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR });
				roleService.findByName.mockResolvedValue(roomOwnerRole);

				return { roomOwnerRole, roomEditorRole };
			};

			const setupUserWithSecondarySchool = () => {
				const secondarySchool = schoolFactory.build();
				const otherSchool = schoolFactory.build();
				const role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const guestTeacher = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
				const externalUser = userDoFactory.buildWithId({
					roles: [role],
					secondarySchools: [{ schoolId: secondarySchool.id, role: new RoleDto(guestTeacher) }],
				});
				const externalUserId = externalUser.id as string;

				return { secondarySchool, externalUser, externalUserId, otherSchool };
			};

			describe('when removing user from a different school, with no further groups on host school', () => {
				const setup = () => {
					const { secondarySchool, externalUserId } = setupUserWithSecondarySchool();
					const { roomEditorRole } = setupRoomRoles();

					const { room, group } = setupGroupAndRoom(secondarySchool.id);
					group.addUser({ userId: externalUserId, roleId: roomEditorRole.id });

					mockGroupsAtSchoolAfterRemoval([]);

					return { secondarySchool, externalUserId, room, group };
				};

				it('should pass the schoolId of the room', async () => {
					const { secondarySchool, externalUserId, room } = setup();

					await service.removeMembersFromRoom(room.id, [externalUserId]);

					expect(groupService.findGroups).toHaveBeenCalledWith(
						expect.objectContaining({ schoolId: secondarySchool.id })
					);
				});

				it('should remove user from room', async () => {
					const { group, externalUserId, room } = setup();

					await service.removeMembersFromRoom(room.id, [externalUserId]);

					expect(groupService.removeUsersFromGroup).toHaveBeenCalledWith(group.id, [externalUserId]);
				});

				it('should remove user from secondary school', async () => {
					const { secondarySchool, externalUserId, room } = setup();

					await service.removeMembersFromRoom(room.id, [externalUserId]);

					expect(userService.removeSecondarySchoolFromUsers).toHaveBeenCalledWith([externalUserId], secondarySchool.id);
				});
			});

			describe('when removing user from a different school, with further groups on host school', () => {
				const setup = () => {
					const { secondarySchool, externalUser } = setupUserWithSecondarySchool();
					const { roomEditorRole } = setupRoomRoles();

					const { room, group } = setupGroupAndRoom(secondarySchool.id);
					group.addUser({ userId: externalUser.id as string, roleId: roomEditorRole.id });
					const { group: group2 } = setupGroupAndRoom(secondarySchool.id);
					group2.addUser({ userId: externalUser.id as string, roleId: roomEditorRole.id });

					mockGroupsAtSchoolAfterRemoval([group2]);

					return { externalUser, room };
				};

				it('should not remove user from secondary school', async () => {
					const { externalUser, room } = setup();

					await service.removeMembersFromRoom(room.id, [externalUser.id as string]);

					expect(userService.removeSecondarySchoolFromUsers).not.toHaveBeenCalled();
				});
			});

			describe('when removing user from the same school', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const { roomEditorRole } = setupRoomRoles();
					const { room, group } = setupGroupAndRoom(user.school.id);
					group.addUser({ userId: user.id, roleId: roomEditorRole.id });

					mockGroupsAtSchoolAfterRemoval([group]);

					return { user, room, group };
				};

				it('should remove user from room', async () => {
					const { user, group, room } = setup();

					await service.removeMembersFromRoom(room.id, [user.id]);

					expect(groupService.removeUsersFromGroup).toHaveBeenCalledWith(group.id, [user.id]);
				});
			});

			describe('when removing the owner of the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const { room, group } = setupGroupAndRoom(user.school.id);
					const { roomOwnerRole } = setupRoomRoles();

					group.addUser({ userId: user.id, roleId: roomOwnerRole.id });

					return { user, room };
				};

				it('should not throw an error, as e.g. KNL could be using this', async () => {
					const { user, room } = setup();

					await expect(service.removeMembersFromRoom(room.id, [user.id])).resolves.toBe(undefined);
				});
			});
		});
	});

	describe('changeRoleOfRoomMembers', () => {
		describe('when roomMembership does not exist', () => {
			it('should throw an exception', async () => {
				roomMembershipRepo.findByRoomId.mockResolvedValue(null);

				await expect(
					service.changeRoleOfRoomMembers(new ObjectId().toHexString(), [], RoleName.ROOMEDITOR)
				).rejects.toThrowError(BadRequestException);
			});
		});

		describe('when roomMembership exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const otherUser = userFactory.buildWithId();
				const userNotInRoom = userFactory.buildWithId();
				const school = schoolFactory.build();
				const viewerRole = roleFactory.buildWithId({ name: RoleName.ROOMVIEWER });
				const editorRole = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR });
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					organizationId: school.id,
					users: [
						{ userId: user.id, roleId: viewerRole.id },
						{ userId: otherUser.id, roleId: viewerRole.id },
					],
				});
				const room = roomFactory.build({ schoolId: school.id });
				const roomMembership = roomMembershipFactory.build({
					roomId: room.id,
					userGroupId: group.id,
					schoolId: school.id,
				});

				roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);
				groupService.findById.mockResolvedValue(group);
				roleService.findByName.mockResolvedValue(editorRole);

				return {
					user,
					otherUser,
					userNotInRoom,
					room,
					roomMembership,
					group,
					viewerRole,
					editorRole,
				};
			};

			it('should change role of user to editor', async () => {
				const { user, room, group, editorRole } = setup();

				await service.changeRoleOfRoomMembers(room.id, [user.id], RoleName.ROOMEDITOR);

				expect(groupService.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: group.id,
						users: expect.arrayContaining([{ userId: user.id, roleId: editorRole.id }]) as GroupUser[],
					})
				);
			});

			it('should not change role of other user', async () => {
				const { user, otherUser, room, group, viewerRole } = setup();

				await service.changeRoleOfRoomMembers(room.id, [user.id], RoleName.ROOMEDITOR);

				expect(groupService.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: group.id,
						users: expect.arrayContaining([{ userId: otherUser.id, roleId: viewerRole.id }]) as GroupUser[],
					})
				);
			});

			it('should ignore changing a user that is not in the room', async () => {
				const { userNotInRoom, room, group } = setup();

				await service.changeRoleOfRoomMembers(room.id, [userNotInRoom.id], RoleName.ROOMEDITOR);

				expect(groupService.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: group.id,
						users: expect.not.arrayContaining([expect.objectContaining({ userId: userNotInRoom.id })]) as GroupUser[],
					})
				);
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
				groupService.findGroups.mockResolvedValue({ data: [], total: 0 });

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

	describe('getRoomMembers', () => {
		const setup = () => {
			const roomId = 'room123';
			const userId = 'user456';
			const groupId = 'group789';
			const roleId = 'role101';

			const user = userDoFactory.buildWithId({ id: userId });
			const roomMembership = roomMembershipFactory.build({ roomId, userGroupId: groupId });
			const group = groupFactory.build({ id: groupId, users: [{ userId, roleId }] });

			roomMembershipRepo.findByRoomId.mockResolvedValue(roomMembership);
			groupService.findById.mockResolvedValue(group);
			roleService.findByIds.mockResolvedValue([]);
			userService.findByIds.mockResolvedValue([user]);

			return { roomId, userId, groupId, roleId, roomMembership, group };
		};

		describe('when roleId does not point to existing role', () => {
			it('should remove member from result', async () => {
				const { roomId } = setup();

				const result = await service.getRoomMembers(roomId);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('getRoomAuthorizable', () => {
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
			roleService.findAll.mockResolvedValue([role]);
			userService.findByIds.mockResolvedValue([userDoFactory.buildWithId({ id: userId })]);

			return { roomId, userId, groupId, roleId, roomMembership, group, role };
		};

		it('should return RoomAuthorizable when roomMembership exists', async () => {
			const { roomId, userId, roleId } = setup();

			const result = await service.getRoomAuthorizable(roomId);

			expect(result).toBeInstanceOf(RoomAuthorizable);
			expect(result.roomId).toBe(roomId);
			expect(result.members).toHaveLength(1);
			expect(result.members[0].userId).toBe(userId);
			expect(result.members[0].roles[0].id).toBe(roleId);
			expect(result.members[0].userSchoolId).toBeDefined();
		});

		it('should return empty RoomAuthorizable when roomMembership not exists', async () => {
			const roomId = 'nonexistent';
			roomMembershipRepo.findByRoomId.mockResolvedValue(null);
			roomService.getSingleRoom.mockResolvedValue(roomFactory.build({ id: roomId }));

			const result = await service.getRoomAuthorizable(roomId);

			expect(result).toBeInstanceOf(RoomAuthorizable);
			expect(result.roomId).toBe(roomId);
			expect(result.members).toHaveLength(0);
		});
	});

	describe('getRoomMembershipStatsByUsersSchoolId', () => {
		const convertToGroupUsers = (users: UserDo[], role: RoleDto) =>
			users.map((user) => {
				return {
					userId: user.id ?? new ObjectId().toHexString(),
					roleId: role.id ?? new ObjectId().toHexString(),
				};
			});

		const setup = () => {
			const role = roleFactory.buildWithId({ name: RoleName.TEACHER });

			const schoolId1 = 'school123';
			const usersSchool2 = userDoFactory.buildListWithId(3, {
				roles: [role],
				schoolId: schoolId1,
			});
			const schoolId2 = 'school456';
			const usersSchool1 = userDoFactory.buildListWithId(2, {
				roles: [role],
				schoolId: schoolId2,
			});

			const groupSchool1 = groupFactory.build({
				users: convertToGroupUsers(usersSchool2, role),
			});
			const groupSchool2 = groupFactory.build({
				users: convertToGroupUsers(usersSchool1, role),
			});
			const mixedGroup = groupFactory.build({
				users: convertToGroupUsers([...usersSchool2, ...usersSchool1], role),
			});

			groupService.findByUsersAndRoomsSchoolId.mockImplementation((schoolId: string) => {
				if (schoolId === schoolId1) {
					return Promise.resolve({ data: [groupSchool1, mixedGroup], total: 2 });
				} else if (schoolId === schoolId2) {
					return Promise.resolve({ data: [groupSchool2, mixedGroup], total: 2 });
				} else {
					return Promise.resolve({ data: [], total: 0 });
				}
			});

			roomMembershipRepo.findByGroupIds.mockImplementation((groupIds: string[]) => {
				const allGroups = [groupSchool1, groupSchool2, mixedGroup];
				const requestedGroups = allGroups.filter((group) => groupIds.includes(group.id));
				return Promise.resolve(
					requestedGroups.map((group) =>
						roomMembershipFactory.build({ userGroupId: group.id, schoolId: group.organizationId })
					)
				);
			});

			userService.findByIds.mockImplementation((userIds: string[]) => {
				const users = userIds
					.map(
						(userId) =>
							usersSchool2.find((user) => user.id === userId) ?? usersSchool1.find((user) => user.id === userId)
					)
					.filter((user): user is UserDo => user !== undefined);
				return Promise.resolve(users);
			});

			roleService.findByName.mockResolvedValue(role);

			return { schoolId1, schoolId2, usersSchool1, usersSchool2, groupSchool1, groupSchool2, mixedGroup };
		};

		it('should return room membership stats for school1', async () => {
			const { schoolId1 } = setup();

			const result = await service.getRoomMembershipStatsByUsersAndRoomsSchoolId(schoolId1);

			expect(result.total).toBe(2);
			expect(result.data.length).toEqual(2);
			const [internalGroup, externalGroup] = result.data;
			expect(internalGroup?.totalMembers).toEqual(3);
			expect(externalGroup?.totalMembers).toEqual(5);
		});

		it('should return room membership stats for school2', async () => {
			const { schoolId2 } = setup();

			const result = await service.getRoomMembershipStatsByUsersAndRoomsSchoolId(schoolId2);

			expect(result.total).toBe(2);
			expect(result.data.length).toEqual(2);
			const [internalGroup, externalGroup] = result.data;
			expect(internalGroup?.totalMembers).toEqual(2);
			expect(externalGroup?.totalMembers).toEqual(5);
		});

		it('should return empty result for unknown school', async () => {
			setup();
			const unknownSchoolId = 'unknownSchoolId';

			const result = await service.getRoomMembershipStatsByUsersAndRoomsSchoolId(unknownSchoolId);

			expect(result.total).toBe(0);
			expect(result.data.length).toEqual(0);
		});
	});

	describe('getRoomAuthorizablesByUserId', () => {
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
			roleService.findAll.mockResolvedValue(roles);
			userService.findByIds.mockResolvedValue([userDoFactory.buildWithId({ id: userId })]);

			return { userId, roomMemberships, roles };
		};

		it('should return RoomAuthorizables for user', async () => {
			const { userId, roomMemberships, roles } = setup();

			const result = await service.getRoomAuthorizablesByUserId(userId);

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(RoomAuthorizable);
			expect(result[0].roomId).toBe(roomMemberships[0].roomId);
			expect(result[0].members[0].userId).toBe(userId);
			expect(result[0].members[0].roles[0].id).toBe(roles[0].id);
			expect(result[1]).toBeInstanceOf(RoomAuthorizable);
			expect(result[1].roomId).toBe(roomMemberships[1].roomId);
			expect(result[1].members[0].userId).toBe(userId);
			expect(result[1].members[0].roles[0].id).toBe(roles[1].id);
		});

		it('should return empty array when no groups found', async () => {
			const { userId } = setup();
			groupService.findGroups.mockResolvedValue({ data: [], total: 0 });

			const result = await service.getRoomAuthorizablesByUserId(userId);

			expect(result).toHaveLength(0);
		});

		it('should handle paginated data by making recursive calls when not all room group data is loaded with the initial call', async () => {
			const userId = 'user123';
			const groupId1 = 'group456';
			const groupId2 = 'group789';
			const groupId3 = 'group101';
			const roomId1 = 'room111';
			const roomId2 = 'room222';
			const roomId3 = 'room333';
			const roleId = 'role333';

			const firstBatchGroups = [
				groupFactory.build({ id: groupId1, users: [{ userId, roleId }] }),
				groupFactory.build({ id: groupId2, users: [{ userId, roleId }] }),
			];
			const secondBatchGroups = [groupFactory.build({ id: groupId3, users: [{ userId, roleId }] })];

			const roomMemberships = [
				roomMembershipFactory.build({ roomId: roomId1, userGroupId: groupId1 }),
				roomMembershipFactory.build({ roomId: roomId2, userGroupId: groupId2 }),
				roomMembershipFactory.build({ roomId: roomId3, userGroupId: groupId3 }),
			];
			const roles = [roleDtoFactory.build({ id: roleId })];

			groupService.findGroups
				.mockResolvedValueOnce({ data: firstBatchGroups, total: 3 })
				.mockResolvedValueOnce({ data: secondBatchGroups, total: 3 });

			roomMembershipRepo.findByGroupIds.mockResolvedValue(roomMemberships);
			roleService.findByIds.mockResolvedValue(roles);
			roleService.findAll.mockResolvedValue(roles);
			userService.findByIds.mockResolvedValue([userDoFactory.buildWithId({ id: userId })]);

			const result = await service.getRoomAuthorizablesByUserId(userId);

			expect(groupService.findGroups).toHaveBeenCalledTimes(2);
			expect(groupService.findGroups).toHaveBeenNthCalledWith(
				1,
				{
					groupTypes: [GroupTypes.ROOM],
					userId,
				},
				{ pagination: { skip: 0, limit: 100 } }
			);
			expect(groupService.findGroups).toHaveBeenNthCalledWith(
				2,
				{
					groupTypes: [GroupTypes.ROOM],
					userId,
				},
				{ pagination: { skip: 2, limit: 100 } }
			);

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.roomId)).toEqual(expect.arrayContaining([roomId1, roomId2, roomId3]));
		});
	});
});
