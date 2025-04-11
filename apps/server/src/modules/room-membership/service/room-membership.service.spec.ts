import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Group, GroupService, GroupTypes, GroupUser } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { roleDtoFactory, roleFactory } from '@modules/role/testing';
import { RoomService } from '@modules/room';
import { roomFactory } from '@modules/room/testing';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { BadRequestException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ObjectId } from 'bson';
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
	let userService: DeepMocked<UserService>;
	let configService: DeepMocked<ConfigService>;

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
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get<RoomMembershipService>(RoomMembershipService);
		roomMembershipRepo = module.get(RoomMembershipRepo);
		groupService = module.get(GroupService);
		roleService = module.get(RoleService);
		roomService = module.get(RoomService);
		userService = module.get(UserService);
		configService = module.get(ConfigService);
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

				configService.get.mockImplementation((key) => {
					if (key === 'FEATURE_ROOMS_CHANGE_PERMISSIONS_ENABLED') return true;
					return undefined;
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

			it('should add user to school', async () => {
				const { user, room } = setup();

				await service.addMembersToRoom(room.id, [user.id]);

				expect(userService.addSecondarySchoolToUsers).toHaveBeenCalledWith([user.id], room.schoolId);
			});

			describe('when role change is disabled', () => {
				const setupWithRoleChangeDisabled = () => {
					const { user, room, group } = setup();

					configService.get.mockImplementation((key) => {
						if (key === 'FEATURE_ROOMS_CHANGE_PERMISSIONS_ENABLED') return false;
						return undefined;
					});

					return { user, room, group };
				};

				it('should add user to room as admin', async () => {
					const { user, room, group } = setupWithRoleChangeDisabled();

					await service.addMembersToRoom(room.id, [user.id]);

					expect(groupService.addUsersToGroup).toHaveBeenCalledWith(group.id, [
						{ userId: user.id, roleName: RoleName.ROOMADMIN },
					]);
				});
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

				it('should throw a badrequest exception', async () => {
					const { user, room } = setup();

					await expect(service.removeMembersFromRoom(room.id, [user.id])).rejects.toThrowError(BadRequestException);
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
			roomService.getSingleRoom.mockResolvedValue(roomFactory.build({ id: roomId }));

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
