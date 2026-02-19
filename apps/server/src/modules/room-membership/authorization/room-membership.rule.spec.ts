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
import { RoomAuthorizable } from '../do/room-authorizable.do';
import { RoomRule } from './room.rule';

describe(RoomRule.name, () => {
	let service: RoomRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoomRule,
				AuthorizationHelper,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(RoomRule);
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
				const roomAuthorizable = new RoomAuthorizable('', [], user.school.id);

				return { user, roomAuthorizable };
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();
				const result = service.isApplicable(user, roomAuthorizable);

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
					const roomAuthorizable = new RoomAuthorizable('', [], user.school.id);

					return { user, roomAuthorizable };
				};

				it('should return "false" for read action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
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
					const roomAuthorizable = new RoomAuthorizable(
						'',
						[{ roles: [roleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomAuthorizable };
				};

				it('should return "true" for read action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});

				it('should return "false" for write action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});

				it('should return false for change owner action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
						action: Action.read,
						requiredPermissions: [Permission.ROOM_CHANGE_OWNER],
					});

					expect(res).toBe(false);
				});
			});

			describe('when user is not member of room', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roomAuthorizable = new RoomAuthorizable('', [], user.school.id);

					return { user, roomAuthorizable };
				};

				it('should return "false" for read action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});

				it('should return "false" for write action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
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
					const roomAuthorizable = new RoomAuthorizable(
						room.id,
						[{ roles: [roleDto], userId: user.id, userSchoolId: otherSchool.id }],
						otherSchool.id
					);

					return { user, roomAuthorizable };
				};

				it('should return "true" for read action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});

				it('should return "false" for write action', () => {
					const { user, roomAuthorizable } = setup();

					const res = service.hasPermission(user, roomAuthorizable, {
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
				const roomAuthorizable = new RoomAuthorizable('', [], otherSchool.id);

				return { user, roomAuthorizable };
			};

			it('should return "false" for read action', () => {
				const { user, roomAuthorizable } = setup();

				const res = service.hasPermission(user, roomAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});

			it('should return "false" for write action', () => {
				const { user, roomAuthorizable } = setup();

				const res = service.hasPermission(user, roomAuthorizable, {
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

					const result = service.can('createRoom', userWithPermission, null as unknown as RoomAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when user does not have school create room permission', () => {
				it('should return false', () => {
					const { userWithoutPermission } = setup();

					const result = service.can('createRoom', userWithoutPermission, null as unknown as RoomAuthorizable);

					expect(result).toBe(false);
				});
			});
		});
	});

	describe('canCopyRoom', () => {
		const setup = () => {
			const userWithPermission = userFactory.asTeacher().buildWithId();
			const userWithoutPermission = userFactory.buildWithId();

			const roleDtoWithPermission = roleDtoFactory.build({ permissions: [Permission.ROOM_COPY_ROOM] });
			const roleDtoWithoutPermission = roleDtoFactory.build({ permissions: [] });

			const roomAuthorizableWithPermission = new RoomAuthorizable(
				'roomId',
				[{ roles: [roleDtoWithPermission], userId: userWithPermission.id, userSchoolId: userWithPermission.school.id }],
				userWithPermission.school.id
			);

			const roomAuthorizableWithoutPermission = new RoomAuthorizable(
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
				roomAuthorizableWithPermission,
				roomAuthorizableWithoutPermission,
			};
		};

		describe('when user has room copy permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomAuthorizableWithPermission } = setup();

				const result = service.can('copyRoom', userWithPermission, roomAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room copy permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomAuthorizableWithoutPermission } = setup();

				const result = service.can('copyRoom', userWithoutPermission, roomAuthorizableWithoutPermission);

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
					const roomAuthorizable = new RoomAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomAuthorizable };
				};

				it('should return true', () => {
					const { user, roomAuthorizable } = setup();

					const result = service.can('accessRoom', user, roomAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when room has users from admin school', () => {
				const setup = () => {
					const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
					const user = userFactory.buildWithId({ roles: [schoolRole] });
					const otherSchool = schoolEntityFactory.buildWithId();
					const roomRoleDto = roleDtoFactory.build({ permissions: [] });
					const roomAuthorizable = new RoomAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: 'otherId', userSchoolId: user.school.id }],
						otherSchool.id
					);

					return { user, roomAuthorizable };
				};

				it('should return true', () => {
					const { user, roomAuthorizable } = setup();

					const result = service.can('accessRoom', user, roomAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when room is from admin school', () => {
				const setup = () => {
					const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
					const user = userFactory.buildWithId({ roles: [schoolRole] });
					const roomRoleDto = roleDtoFactory.build({ permissions: [] });
					const roomAuthorizable = new RoomAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: 'otherId', userSchoolId: 'otherSchoolId' }],
						user.school.id
					);

					return { user, roomAuthorizable };
				};

				it('should return true', () => {
					const { user, roomAuthorizable } = setup();

					const result = service.can('accessRoom', user, roomAuthorizable);

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
					const roomAuthorizable = new RoomAuthorizable(
						'roomId',
						[{ roles: [roomOwnerRoleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomAuthorizable };
				};

				it('should return true', () => {
					const { user, roomAuthorizable } = setup();

					const result = service.can('accessRoom', user, roomAuthorizable);

					expect(result).toBe(true);
				});
			});

			describe('when room has no owner', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
					const roomAuthorizable = new RoomAuthorizable(
						'roomId',
						[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
						user.school.id
					);

					return { user, roomAuthorizable };
				};

				it('should return false', () => {
					const { user, roomAuthorizable } = setup();

					const result = service.can('accessRoom', user, roomAuthorizable);

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
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('addMembers', user, roomAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission and room is from admin school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('addMembers', user, roomAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission but room is not from admin school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const otherSchool = schoolEntityFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					otherSchool.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('addMembers', user, roomAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has neither permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('addMembers', user, roomAuthorizable);

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

			const roomAuthorizableWithPermission = new RoomAuthorizable(
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

			const roomAuthorizableWithoutPermission = new RoomAuthorizable(
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
				roomAuthorizableWithPermission,
				roomAuthorizableWithoutPermission,
			};
		};

		describe('when user has room add members permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomAuthorizableWithPermission } = setup();

				const result = service.can('addExternalPersonByEmail', userWithPermission, roomAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room add members permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomAuthorizableWithoutPermission } = setup();

				const result = service.can(
					'addExternalPersonByEmail',
					userWithoutPermission,
					roomAuthorizableWithoutPermission
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

			const roomAuthorizableWithPermission = new RoomAuthorizable(
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

			const roomAuthorizableWithoutPermission = new RoomAuthorizable(
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
				roomAuthorizableWithPermission,
				roomAuthorizableWithoutPermission,
			};
		};

		describe('when user has room change roles permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomAuthorizableWithPermission } = setup();

				const result = service.can('changeRolesOfMembers', userWithPermission, roomAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room change roles permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomAuthorizableWithoutPermission } = setup();

				const result = service.can('changeRolesOfMembers', userWithoutPermission, roomAuthorizableWithoutPermission);

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

			const roomAuthorizableWithPermission = new RoomAuthorizable(
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

			const roomAuthorizableWithoutPermission = new RoomAuthorizable(
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
				roomAuthorizableWithPermission,
				roomAuthorizableWithoutPermission,
			};
		};

		describe('when user has room leave permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomAuthorizableWithPermission } = setup();

				const result = service.can('leaveRoom', userWithPermission, roomAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room leave permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomAuthorizableWithoutPermission } = setup();

				const result = service.can('leaveRoom', userWithoutPermission, roomAuthorizableWithoutPermission);

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

			const roomAuthorizableWithPermission = new RoomAuthorizable(
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

			const roomAuthorizableWithoutPermission = new RoomAuthorizable(
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
				roomAuthorizableWithPermission,
				roomAuthorizableWithoutPermission,
			};
		};

		describe('when user has room edit permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomAuthorizableWithPermission } = setup();

				const result = service.can('updateRoom', userWithPermission, roomAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have room edit permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomAuthorizableWithoutPermission } = setup();

				const result = service.can('updateRoom', userWithoutPermission, roomAuthorizableWithoutPermission);

				expect(result).toBe(false);
			});
		});
	});

	describe('canDeleteRoom', () => {
		describe('when user has room delete permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_DELETE_ROOM] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('deleteRoom', user, roomAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission and room is from own school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('deleteRoom', user, roomAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has school admin permission but room is not from own school', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_ADMINISTRATE_ROOMS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const otherSchool = schoolEntityFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					otherSchool.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('deleteRoom', user, roomAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has neither permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('deleteRoom', user, roomAuthorizable);

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
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('getRoomMembers', user, roomAuthorizable);

				expect(result).toBe(true);
			});
		});

		describe('when user has only school list members permission', () => {
			const setup = () => {
				const schoolRole = roleFactory.build({ permissions: [Permission.SCHOOL_LIST_ROOM_MEMBERS] });
				const user = userFactory.buildWithId({ roles: [schoolRole] });
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('getRoomMembers', user, roomAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has only room list content permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_LIST_CONTENT] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('getRoomMembers', user, roomAuthorizable);

				expect(result).toBe(false);
			});
		});

		describe('when user has neither permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomRoleDto = roleDtoFactory.build({ permissions: [] });
				const roomAuthorizable = new RoomAuthorizable(
					'roomId',
					[{ roles: [roomRoleDto], userId: user.id, userSchoolId: user.school.id }],
					user.school.id
				);

				return { user, roomAuthorizable };
			};

			it('should return false', () => {
				const { user, roomAuthorizable } = setup();

				const result = service.can('getRoomMembers', user, roomAuthorizable);

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

			const roomAuthorizableWithPermission = new RoomAuthorizable(
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

			const roomAuthorizableWithoutPermission = new RoomAuthorizable(
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
				roomAuthorizableWithPermission,
				roomAuthorizableWithoutPermission,
			};
		};

		describe('when user has school administrate rooms permission', () => {
			it('should return true', () => {
				const { userWithPermission, roomAuthorizableWithPermission } = setup();

				const result = service.can('getRoomMembersRedacted', userWithPermission, roomAuthorizableWithPermission);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have school administrate rooms permission', () => {
			it('should return false', () => {
				const { userWithoutPermission, roomAuthorizableWithoutPermission } = setup();

				const result = service.can('getRoomMembersRedacted', userWithoutPermission, roomAuthorizableWithoutPermission);

				expect(result).toBe(false);
			});
		});
	});
});
