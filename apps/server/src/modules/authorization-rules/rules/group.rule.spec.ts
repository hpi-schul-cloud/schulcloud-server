import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { Group } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { GroupRule } from './group.rule';

describe('GroupRule', () => {
	let module: TestingModule;
	let rule: GroupRule;
	let injectionService: AuthorizationInjectionService;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities([User, Group]);

		module = await Test.createTestingModule({
			providers: [
				GroupRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		rule = module.get(GroupRule);
		injectionService = module.get(AuthorizationInjectionService);
		authorizationHelper = module.get(AuthorizationHelper);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when the entity is applicable', () => {
			const setup = () => {
				const role = roleFactory.buildWithId();
				const user = userFactory.buildWithId({ roles: [role] });
				const group = groupFactory.build({
					users: [
						{
							userId: user.id,
							roleId: user.roles[0].id,
						},
					],
				});

				return {
					user,
					group,
				};
			};

			it('should return true', () => {
				const { user, group } = setup();

				const result = rule.isApplicable(user, group);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const role = roleFactory.buildWithId();
				const userNotInGroup = userFactory.buildWithId({ roles: [role] });

				return {
					userNotInGroup,
				};
			};

			it('should return false', () => {
				const { userNotInGroup } = setup();

				const result = rule.isApplicable(userNotInGroup, {} as unknown as Group);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user has all required permissions and is at the same school then the group', () => {
			const setup = () => {
				const role = roleFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school, roles: [role] });
				const group = groupFactory.build({
					users: [
						{
							userId: user.id,
							roleId: user.roles[0].id,
						},
					],
					organizationId: user.school.id,
				});
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.GROUP_VIEW],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(true);

				return {
					user,
					group,
					context,
				};
			};

			it('should check all permissions', () => {
				const { user, group, context } = setup();

				rule.hasPermission(user, group, context);

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(user, context.requiredPermissions);
			});

			it('should return true', () => {
				const { user, group, context } = setup();

				const result = rule.hasPermission(user, group, context);

				expect(result).toEqual(true);
			});
		});

		describe('when the user has not the required permission', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({ permissions: [] });
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school, roles: [role] });
				const group = groupFactory.build({
					users: [
						{
							userId: user.id,
							roleId: user.roles[0].id,
						},
					],
					organizationId: user.school.id,
				});
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.GROUP_VIEW],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(false);

				return {
					user,
					group,
					context,
				};
			};

			it('should return false', () => {
				const { user, group, context } = setup();

				const result = rule.hasPermission(user, group, context);

				expect(result).toEqual(false);
			});
		});

		describe('when the user is at another school then the group', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({ permissions: [] });
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school, roles: [role] });
				const group = groupFactory.build({
					users: [
						{
							userId: user.id,
							roleId: user.roles[0].id,
						},
					],
					organizationId: new ObjectId().toHexString(),
				});
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.GROUP_VIEW],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(true);

				return {
					user,
					group,
					context,
				};
			};

			it('should return false', () => {
				const { user, group, context } = setup();

				const result = rule.hasPermission(user, group, context);

				expect(result).toEqual(false);
			});
		});
	});
});
