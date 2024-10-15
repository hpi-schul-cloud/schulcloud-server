import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, User } from '@shared/domain/entity';
import { groupEntityFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationHelper, AuthorizationInjectionService } from '@src/modules/authorization';
import { RoomMemberEntity } from '@src/modules/room-member';
import { roomMemberEntityFactory } from '@src/modules/room-member/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { Action, AuthorizationContext } from '@src/modules/authorization/domain/type';
import { RoomMemberRule } from './room-member.rule';

describe('RoomMemberRule', () => {
	let module: TestingModule;
	let rule: RoomMemberRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				RoomMemberRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		rule = module.get(RoomMemberRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const roomMember: RoomMemberEntity = roomMemberEntityFactory.build({});

				return {
					user,
					roomMember,
				};
			};

			it('should return true', () => {
				const { user, roomMember } = setup();

				const result = rule.isApplicable(user, roomMember);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should return false', () => {
				const { user } = setup();

				const result = rule.isApplicable(user, user);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user has no permission', () => {
			const setup = () => {
				const role: Role = roleFactory.buildWithId();
				const user: User = userFactory.buildWithId();
				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [{ role, user }],
					organization: undefined,
					externalSource: undefined,
				});

				const roomMember = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

				return {
					user,
					roomMember,
				};
			};

			it('should not allow read', () => {
				const { roomMember, user } = setup();
				const context: AuthorizationContext = {
					action: Action.read,
					requiredPermissions: [],
				};
				const result = rule.hasPermission(user, roomMember, context);

				expect(result).toEqual(false);
			});

			it('should not allow write', () => {
				const { roomMember, user } = setup();
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [],
				};
				const result = rule.hasPermission(user, roomMember, context);

				expect(result).toEqual(false);
			});
		});

		describe('when user has ROOM_EDITOR role', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({
					name: RoleName.ROOM_EDITOR,
					permissions: [Permission.ROOM_EDIT, Permission.ROOM_VIEW],
				});
				const user = userFactory.buildWithId();
				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [{ role, user }],
					organization: undefined,
					externalSource: undefined,
				});

				const roomMember = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

				return { user, roomMember };
			};

			it('should allow read', () => {
				const { user, roomMember } = setup();
				const context = { action: Action.read, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomMember, context);
				expect(result).toEqual(true);
			});

			it('should allow write', () => {
				const { user, roomMember } = setup();
				const context = { action: Action.write, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomMember, context);
				expect(result).toEqual(true);
			});
		});

		describe('when user has ROOM_VIEWER role', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({ name: RoleName.ROOM_VIEWER, permissions: [Permission.ROOM_VIEW] });
				const user = userFactory.buildWithId();
				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [{ role, user }],
					organization: undefined,
					externalSource: undefined,
				});

				const roomMember = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

				return { user, roomMember };
			};

			it('should allow read', () => {
				const { user, roomMember } = setup();
				const context = { action: Action.read, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomMember, context);
				expect(result).toEqual(true);
			});

			it('should not allow write', () => {
				const { user, roomMember } = setup();
				const context = { action: Action.write, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomMember, context);
				expect(result).toEqual(false);
			});
		});

		describe('when user is not room member', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [],
					organization: undefined,
					externalSource: undefined,
				});

				const roomMember = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

				return { user, roomMember };
			};

			it('should not allow read', () => {
				const { user, roomMember } = setup();
				const context = { action: Action.read, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomMember, context);
				expect(result).toEqual(false);
			});

			it('should not allow write', () => {
				const { user, roomMember } = setup();
				const context = { action: Action.write, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomMember, context);
				expect(result).toEqual(false);
			});
		});
	});
});
