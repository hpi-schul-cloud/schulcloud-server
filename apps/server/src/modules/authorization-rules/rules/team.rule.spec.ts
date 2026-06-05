import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { roleFactory } from '@modules/role/testing';
import { teamFactory } from '@modules/team/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { TeamRule } from './team.rule';

describe('TeamRule', () => {
	let rule: TeamRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				TeamRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		rule = await module.get(TeamRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when entity type team', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const team = teamFactory.build();

				return {
					user,
					team,
				};
			};

			it('should return true', () => {
				const { user, team } = setup();

				const result = rule.isApplicable(user, team);

				expect(result).toBe(true);
			});
		});

		describe('when entity type is wrong', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should return false', () => {
				const { user } = setup();

				const result = rule.isApplicable(user, user);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user is not a team user', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.build();

				return {
					user,
					team,
					permissionA,
				};
			};

			it('should return "false"', () => {
				const { user, team, permissionA } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([permissionA]));

				expect(res).toBe(false);
			});
		});

		describe('when user is a team user', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const permissionC = 'c' as Permission;
				const teamPermissionA = 'TA' as Permission;
				const teamPermissionD = 'TD' as Permission;
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const teamRole = roleFactory.buildWithId({ permissions: [teamPermissionA] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.withRoleAndUserId(teamRole, user.id).build();

				return {
					user,
					team,
					permissionA,
					permissionC,
					teamPermissionD,
				};
			};

			it('should return "false" teamRole has not permission', () => {
				const { user, team, teamPermissionD } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionD]));

				expect(res).toBe(false);
			});

			it('should return "false" if user has global permission', () => {
				const { user, team, permissionA } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([permissionA]));

				expect(res).toBe(false);
			});

			it('should return "false" if user has not global permission', () => {
				const { user, team, permissionC } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([permissionC]));

				expect(res).toBe(false);
			});
		});

		describe('when user is a team user and teamRoles are inherited ', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const teamPermissionA = 'TA' as Permission;
				const teamPermissionB = 'TB' as Permission;
				const teamPermissionC = 'TC' as Permission;
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const teamRoleA = roleFactory.buildWithId({ permissions: [teamPermissionA] });
				const teamRoleB = roleFactory.buildWithId({ permissions: [teamPermissionB], roles: [teamRoleA] });
				const teamRole = roleFactory.buildWithId({ permissions: [teamPermissionC], roles: [teamRoleB] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.withRoleAndUserId(teamRole, user.id).build();

				return {
					user,
					team,
					teamPermissionA,
					teamPermissionB,
					teamPermissionC,
				};
			};

			it('should return "true" by teamRoleA ', () => {
				const { user, team, teamPermissionA } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionA]));

				expect(res).toBe(true);
			});

			it('should return "true" by teamRoleB', () => {
				const { user, team, teamPermissionB } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionB]));

				expect(res).toBe(true);
			});

			it('should return "true" by teamRole', () => {
				const { user, team, teamPermissionC } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionC]));

				expect(res).toBe(true);
			});
		});

		describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
			describe('when user has instance operation permission with TEAM_VIEW for read action', () => {
				const setup = () => {
					const role = roleFactory.buildWithId({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.TEAM_VIEW],
					});
					const user = userFactory.buildWithId({ roles: [role] });
					const team = teamFactory.build();

					return { user, team };
				};

				it('should return "true" even without being a team member', () => {
					const { user, team } = setup();

					const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([]));

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission with TEAM_EDIT for write action', () => {
				const setup = () => {
					const role = roleFactory.buildWithId({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.TEAM_EDIT],
					});
					const user = userFactory.buildWithId({ roles: [role] });
					const team = teamFactory.build();

					return { user, team };
				};

				it('should return "true" even without being a team member', () => {
					const { user, team } = setup();

					const res = rule.hasPermission(user, team, AuthorizationContextBuilder.write([]));

					expect(res).toBe(true);
				});
			});

			describe('when user has only CAN_EXECUTE_INSTANCE_OPERATIONS without TEAM_VIEW', () => {
				const setup = () => {
					const role = roleFactory.buildWithId({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
					});
					const user = userFactory.buildWithId({ roles: [role] });
					const team = teamFactory.build();

					return { user, team };
				};

				it('should return "false" for read action', () => {
					const { user, team } = setup();

					const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([]));

					expect(res).toBe(false);
				});
			});

			describe('when user has only CAN_EXECUTE_INSTANCE_OPERATIONS without TEAM_EDIT', () => {
				const setup = () => {
					const role = roleFactory.buildWithId({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
					});
					const user = userFactory.buildWithId({ roles: [role] });
					const team = teamFactory.build();

					return { user, team };
				};

				it('should return "false" for write action', () => {
					const { user, team } = setup();

					const res = rule.hasPermission(user, team, AuthorizationContextBuilder.write([]));

					expect(res).toBe(false);
				});
			});
		});

		describe('when the action is not read or write', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.build();

				return { user, team };
			};

			it('should throw NotImplementedException', () => {
				const { user, team } = setup();

				expect(() => rule.hasPermission(user, team, { action: 'unknown' as Action, requiredPermissions: [] })).toThrow(
					NotImplementedException
				);
			});
		});
	});
});
