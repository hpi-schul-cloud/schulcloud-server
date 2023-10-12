import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory, teamFactory } from '@shared/testing';
import { AuthorizationHelper } from '../service/authorization.helper';
import { TeamRule } from './team.rule';
import { AuthorizationContextBuilder } from '../mapper';

describe('TeamRule', () => {
	let rule: TeamRule;
	const permissionA = 'a' as Permission;
	const permissionC = 'c' as Permission;
	const teamPermissionA = 'TA' as Permission;
	const teamPermissionB = 'TB' as Permission;
	const teamPermissionC = 'TC' as Permission;
	const teamPermissionD = 'TD' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, TeamRule],
		}).compile();

		rule = await module.get(TeamRule);
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
				// @ts-expect-error test with wrong instance
				const result = rule.isApplicable(user, user);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user is not a team user', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.build();
				return {
					user,
					team,
				};
			};

			it('should return "false"', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([permissionA]));

				expect(res).toBe(false);
			});
		});

		describe('when user is a team user', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const teamRole = roleFactory.buildWithId({ permissions: [teamPermissionA] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.withRoleAndUserId(teamRole, user.id).build();
				return {
					user,
					team,
				};
			};

			it('should return "false" teamRole has not permission', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionD]));

				expect(res).toBe(false);
			});

			it('should return "false" if user has global permission', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([permissionA]));

				expect(res).toBe(false);
			});

			it('should return "false" if user has not global permission', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([permissionC]));

				expect(res).toBe(false);
			});
		});

		describe('when user is a team user and teamRoles are inherited ', () => {
			const setup = () => {
				const role = roleFactory.buildWithId({ permissions: [permissionA] });
				const teamRoleA = roleFactory.buildWithId({ permissions: [teamPermissionA] });
				const teamRoleB = roleFactory.buildWithId({ permissions: [teamPermissionB], roles: [teamRoleA] });
				const teamRole = roleFactory.buildWithId({ permissions: [teamPermissionC], roles: [teamRoleB] });
				const user = userFactory.buildWithId({ roles: [role] });
				const team = teamFactory.withRoleAndUserId(teamRole, user.id).build();
				return {
					user,
					team,
				};
			};

			it('should return "true" by teamRoleA ', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionA]));

				expect(res).toBe(true);
			});

			it('should return "true" by teamRoleB', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionB]));

				expect(res).toBe(true);
			});

			it('should return "true" by teamRole', () => {
				const { user, team } = setup();

				const res = rule.hasPermission(user, team, AuthorizationContextBuilder.read([teamPermissionC]));

				expect(res).toBe(true);
			});
		});
	});
});
