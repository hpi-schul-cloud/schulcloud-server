import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@modules/authorization';
import { roleDtoFactory } from '@modules/role/testing';
import { roomFactory } from '@modules/room/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { roleFactory } from '@testing/factory/role.factory';
import { userFactory } from '@testing/factory/user.factory';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';
import { RoomMembershipRule } from './room-membership.rule';

describe(RoomMembershipRule.name, () => {
	let service: RoomMembershipRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [RoomMembershipRule, AuthorizationHelper, AuthorizationInjectionService],
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
					const roleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_VIEW] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						'',
						[{ roles: [roleDto], userId: user.id }],
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
					const roleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_VIEW] });
					const roomMembershipAuthorizable = new RoomMembershipAuthorizable(
						room.id,
						[{ roles: [roleDto], userId: user.id }],
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
	});
});
