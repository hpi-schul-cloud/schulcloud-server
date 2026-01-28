import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { RoleName } from '@modules/role';
import { roleDtoFactory, roleFactory } from '@modules/role/testing';
import { roomFactory } from '@modules/room/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';
import { RoomMembershipRule } from './room-membership.rule';

describe(RoomMembershipRule.name, () => {
	let service: RoomMembershipRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoomMembershipRule,
				AuthorizationHelper,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(RoomMembershipRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable('', [], user.school.id);

				return { user, roomMembershipAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMembershipAuthorizable } = setup();
				const result = service.isApplicable(user, roomMembershipAuthorizable);

				expect(result).toStrictEqual(true);
			});
		});

		describe('when entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				return { user };
			};

			it('should return false', () => {
				const { user } = setup();

				const result = service.isApplicable(user, user);

				expect(result).toStrictEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe("when user's primary school is room's school", () => {
			describe('when user is not member of the room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable('', [], user.school.id);

					return { user, roomMembershipAuthorizable };
				};

				it('should return "false" for read action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});

			describe('when user has view permission for room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'',
						[{ roles: [roleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return "true" for read action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});

				it('should return "false" for write action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});

				it('should return false for change owner action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.read,
						requiredPermissions: [Permission.ROOM_CHANGE_OWNER],
					});

					expect(res).toBe(false);
				});
			});

			describe('when user is not member of room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable('', [], user.school.id);

					return { user, roomMembershipAuthorizable };
				};

				it('should return "false" for read action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});

				it('should return "false" for write action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe("when user is guest at room's school", () => {
			describe('when user has view permission for room', () => {
				const setup = () => {
					const otherSchool = schoolEntityFactory.buildWithId();
					const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
					const user = userFactory.buildWithId({
						secondarySchools: [{ school: otherSchool, role: guestTeacherRole }],
					});
					const room = roomFactory.build({ schoolId: otherSchool.id });
					const roleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						room.id,
						[{ roles: [roleDto], userId: user.id, userSchoolId: otherSchool.id }],
						otherSchool.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return "true" for read action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});

				it('should return "false" for write action', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const res = service.hasPermission(user, roomMembershipAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe("when user's school is not room's school", () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const otherSchool = schoolEntityFactory.buildWithId();
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable('', [], otherSchool.id);

				return { user, roomMembershipAuthorizable };
			};

			it('should return "false" for read action', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const res = service.hasPermission(user, roomMembershipAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});

			it('should return "false" for write action', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const res = service.hasPermission(user, roomMembershipAuthorizable, {
					action: Action.write,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});
	});

	describe('canCreateRoom', () => {
		describe('when user has access to their school', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [Permission.SCHOOL_CREATE_ROOM] });
				const userWithPermission = userFactory.buildWithId({ roles: [role] });
				const userWithoutPermission = userFactory.buildWithId();

				return { userWithPermission, userWithoutPermission };
			};
			describe('when user has school create room permission', () => {
				it('should return true', () => {
					const { userWithPermission } = setup();

					const result = service.canCreateRoom(userWithPermission);

					expect(result).toBe(true);
				});
			});

			describe('when user does not have school create room permission', () => {
				it('should return false', () => {
					const { userWithoutPermission } = setup();

					const result = service.canCreateRoom(userWithoutPermission);

					expect(result).toBe(false);
				});
			});
		});
	});

	describe('canCopyRoom', () => {
		const setup = () => {
			const userWithPermission = userFactory.buildWithId();
			const userWithoutPermission = userFactory.buildWithId();

			const roleDtoWithPermission = roleDtoFactory.build({ permissions: [Permission.ROOM_COPY_ROOM] });
			const roleDtoWithoutPermission = roleDtoFactory.build({ permissions: [] });

			const roomMembershipAuthorizableWithPermission = new RoomMembershipAuthorizable(
				'roomId',
				[{ roles: [roleDtoWithPermission], userId: userWithPermission.id, userSchoolId: userWithPermission.school.id }],
				userWithPermission.school.id
			);

			const roomMembershipAuthorizableWithoutPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roleDtoWithoutPermission],
						userId: userWithoutPermission.id,
						userSchoolId: userWithoutPermission.school.id,
					},
				],
				userWithoutPermission.school.id
			);

			return {
				userWithPermission,
				userWithoutPermission,
				roomMembershipAuthorizableWithPermission,
				roomMembershipAuthorizableWithoutPermission,
			};
		};

		describe('when user has room copy permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomMembershipAuthorizableWithPermission } = setup();

				const result = service.canCopyRoom(userWithPermission, roomMembershipAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room copy permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomMembershipAuthorizableWithoutPermission } = setup();

				const result = service.canCopyRoom(userWithoutPermission, roomMembershipAuthorizableWithoutPermission);

				expect(result).toBe(false);
			});
		});
	});

	describe('canAccessRoom', () => {
		describe('when user has admin permission', () => {
			describe('when user has room list permission', () => {
				const setup = () => {
					const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
					const user = userFactory.buildWithId({ roles: [schoolRole] });
					const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return true', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const result = service.canAccessRoom(user, roomMembershipAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when room has users from admin school', () => {
				const setup = () => {
					const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
					const user = userFactory.buildWithId({ roles: [schoolRole] });
					const otherSchool = schoolEntityFactory.buildWithId();
					const roomRoleDto = roleDtoFactory.build({ permissions: [] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: 'otherId', userSchoolId: user.school.id }],
						otherSchool.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return true', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const result = service.canAccessRoom(user, roomMembershipAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when room is from admin school', () => {
				const setup = () => {
					const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
					const user = userFactory.buildWithId({ roles: [schoolRole] });
					const roomRoleDto = roleDtoFactory.build({ permissions: [] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: 'otherId', userSchoolId: 'otherSchoolId' }],
						user.school.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return true', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const result = service.canAccessRoom(user, roomMembershipAuthorizable);

					expect(result).toBe(true);
				});
			});
		});

		describe('when user does not have admin permission', () => {
			describe('when room has owner and user has room list permission', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roomOwnerRoleDto = roleDtoFactory.build({
						name: RoleName.ROOMOWNER,
						permissions: [Permission.ROOM_LIST_CONTENT],
					});
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'roomId',
						[{ roles: [roomOwnerRoleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return true', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const result = service.canAccessRoom(user, roomMembershipAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when room has no owner', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomMembershipAuthorizable };
				};

				it('should return false', () => {
					const { user, roomMembershipAuthorizable } = setup();

					const result = service.canAccessRoom(user, roomMembershipAuthorizable);

					expect(result).toBe(false);
				});
			});
		});
	});

	describe('canAddMembers', () => {
		describe('when user has room add members permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_ADD_MEMBERS] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canAddMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission and room is from admin school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canAddMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission but room is not from admin school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const otherSchool = schoolEntityFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					otherSchool.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canAddMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has neither permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canAddMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});
	});

	describe('canAddExternalPersonByEmail', () => {
		const setup = () => {
			const userWithPermission = userFactory.buildWithId();
			const userWithoutPermission = userFactory.buildWithId();

			const roomRoleDtoWithPermission = roleDtoFactory.build({ permissions: [Permission.ROOM_ADD_MEMBERS] });
			const roomRoleDtoWithoutPermission = roleDtoFactory.build({ permissions: [] });

			const roomMembershipAuthorizableWithPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithPermission],
						userId: userWithPermission.id,
						userSchoolId: userWithPermission.school.id,
					},
				],
				userWithPermission.school.id
			);

			const roomMembershipAuthorizableWithoutPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithoutPermission],
						userId: userWithoutPermission.id,
						userSchoolId: userWithoutPermission.school.id,
					},
				],
				userWithoutPermission.school.id
			);

			return {
				userWithPermission,
				userWithoutPermission,
				roomMembershipAuthorizableWithPermission,
				roomMembershipAuthorizableWithoutPermission,
			};
		};

		describe('when user has room add members permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomMembershipAuthorizableWithPermission } = setup();

				const result = service.canAddExternalPersonByEmail(
					userWithPermission,
					roomMembershipAuthorizableWithPermission
				);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room add members permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomMembershipAuthorizableWithoutPermission } = setup();

				const result = service.canAddExternalPersonByEmail(
					userWithoutPermission,
					roomMembershipAuthorizableWithoutPermission
				);

				expect(result).toBe(false);
			});
		});
	});

	describe('canChangeRolesOfMembers', () => {
		const setup = () => {
			const userWithPermission = userFactory.buildWithId();
			const userWithoutPermission = userFactory.buildWithId();

			const roomRoleDtoWithPermission = roleDtoFactory.build({ permissions: [Permission.ROOM_CHANGE_ROLES] });
			const roomRoleDtoWithoutPermission = roleDtoFactory.build({ permissions: [] });

			const roomMembershipAuthorizableWithPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithPermission],
						userId: userWithPermission.id,
						userSchoolId: userWithPermission.school.id,
					},
				],
				userWithPermission.school.id
			);

			const roomMembershipAuthorizableWithoutPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithoutPermission],
						userId: userWithoutPermission.id,
						userSchoolId: userWithoutPermission.school.id,
					},
				],
				userWithoutPermission.school.id
			);

			return {
				userWithPermission,
				userWithoutPermission,
				roomMembershipAuthorizableWithPermission,
				roomMembershipAuthorizableWithoutPermission,
			};
		};

		describe('when user has room change roles permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomMembershipAuthorizableWithPermission } = setup();

				const result = service.canChangeRolesOfMembers(userWithPermission, roomMembershipAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room change roles permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomMembershipAuthorizableWithoutPermission } = setup();

				const result = service.canChangeRolesOfMembers(
					userWithoutPermission,
					roomMembershipAuthorizableWithoutPermission
				);

				expect(result).toBe(false);
			});
		});
	});

	describe('canLeaveRoom', () => {
		const setup = () => {
			const userWithPermission = userFactory.buildWithId();
			const userWithoutPermission = userFactory.buildWithId();

			const roomRoleDtoWithPermission = roleDtoFactory.build({ permissions: [Permission.ROOM_LEAVE_ROOM] });
			const roomRoleDtoWithoutPermission = roleDtoFactory.build({ permissions: [] });

			const roomMembershipAuthorizableWithPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithPermission],
						userId: userWithPermission.id,
						userSchoolId: userWithPermission.school.id,
					},
				],
				userWithPermission.school.id
			);

			const roomMembershipAuthorizableWithoutPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithoutPermission],
						userId: userWithoutPermission.id,
						userSchoolId: userWithoutPermission.school.id,
					},
				],
				userWithoutPermission.school.id
			);

			return {
				userWithPermission,
				userWithoutPermission,
				roomMembershipAuthorizableWithPermission,
				roomMembershipAuthorizableWithoutPermission,
			};
		};

		describe('when user has room leave permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomMembershipAuthorizableWithPermission } = setup();

				const result = service.canLeaveRoom(userWithPermission, roomMembershipAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room leave permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomMembershipAuthorizableWithoutPermission } = setup();

				const result = service.canLeaveRoom(userWithoutPermission, roomMembershipAuthorizableWithoutPermission);

				expect(result).toBe(false);
			});
		});
	});

	describe('canUpdateRoom', () => {
		const setup = () => {
			const userWithPermission = userFactory.buildWithId();
			const userWithoutPermission = userFactory.buildWithId();

			const roomRoleDtoWithPermission = roleDtoFactory.build({ permissions: [Permission.ROOM_EDIT_ROOM] });
			const roomRoleDtoWithoutPermission = roleDtoFactory.build({ permissions: [] });

			const roomMembershipAuthorizableWithPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithPermission],
						userId: userWithPermission.id,
						userSchoolId: userWithPermission.school.id,
					},
				],
				userWithPermission.school.id
			);

			const roomMembershipAuthorizableWithoutPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDtoWithoutPermission],
						userId: userWithoutPermission.id,
						userSchoolId: userWithoutPermission.school.id,
					},
				],
				userWithoutPermission.school.id
			);

			return {
				userWithPermission,
				userWithoutPermission,
				roomMembershipAuthorizableWithPermission,
				roomMembershipAuthorizableWithoutPermission,
			};
		};

		describe('when user has room edit permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomMembershipAuthorizableWithPermission } = setup();

				const result = service.canUpdateRoom(userWithPermission, roomMembershipAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room edit permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomMembershipAuthorizableWithoutPermission } = setup();

				const result = service.canUpdateRoom(userWithoutPermission, roomMembershipAuthorizableWithoutPermission);

				expect(result).toBe(false);
			});
		});
	});

	describe('canDeleteRoom', () => {
		describe('when user has room delete permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_DELETE_ROOM] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canDeleteRoom(user, roomMembershipAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission and room is from own school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canDeleteRoom(user, roomMembershipAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission but room is not from own school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const otherSchool = schoolEntityFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					otherSchool.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canDeleteRoom(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has neither permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canDeleteRoom(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});
	});

	describe('canGetRoomMembers', () => {
		describe('when user has both school list members and room list content permissions', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_LIST_ROOM_MEMBERS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canGetRoomMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has only school list members permission', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_LIST_ROOM_MEMBERS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canGetRoomMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has only room list content permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canGetRoomMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has neither permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomMembershipAuthorizable };
			};

			it('should return false', () => {
				const { user, roomMembershipAuthorizable } = setup();

				const result = service.canGetRoomMembers(user, roomMembershipAuthorizable);

				expect(result).toBe(false);
			});
		});
	});

	describe('canGetRoomMembersRedacted', () => {
		const setup = () => {
			const schoolRoleWithPermission = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
			const userWithPermission = userFactory.buildWithId({ roles: [schoolRoleWithPermission] });
			const userWithoutPermission = userFactory.buildWithId();

			const roomRoleDto = roleDtoFactory.build({ permissions: [] });

			const roomMembershipAuthorizableWithPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDto],
						userId: userWithPermission.id,
						userSchoolId: userWithPermission.school.id,
					},
				],
				userWithPermission.school.id
			);

			const roomMembershipAuthorizableWithoutPermission = new RoomMembershipAuthorizable(
				'roomId',
				[
					{
						roles: [roomRoleDto],
						userId: userWithoutPermission.id,
						userSchoolId: userWithoutPermission.school.id,
					},
				],
				userWithoutPermission.school.id
			);

			return {
				userWithPermission,
				userWithoutPermission,
				roomMembershipAuthorizableWithPermission,
				roomMembershipAuthorizableWithoutPermission,
			};
		};

		describe('when user has school administrate rooms permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomMembershipAuthorizableWithPermission } = setup();

				const result = service.canGetRoomMembersRedacted(userWithPermission, roomMembershipAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have school administrate rooms permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomMembershipAuthorizableWithoutPermission } = setup();

				const result = service.canGetRoomMembersRedacted(
					userWithoutPermission,
					roomMembershipAuthorizableWithoutPermission
				);

				expect(result).toBe(false);
			});
		});
	});
});
