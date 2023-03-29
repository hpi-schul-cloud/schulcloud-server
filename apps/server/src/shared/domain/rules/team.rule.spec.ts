import { Test, TestingModule } from '@nestjs/testing';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { Permission } from '../interface';
import PermissionContextBuilder from './permission-context.builder';

describe('TeamRule', () => {
	let service: TeamRule;
	const permissionA = 'a' as Permission;
	const permissionC = 'c' as Permission;
	const teamPermissionA = 'TA' as Permission;
	const teamPermissionB = 'TB' as Permission;
	const teamPermissionC = 'TC' as Permission;
	const teamPermissionD = 'TD' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TeamRule],
		}).compile();

		service = await module.get(TeamRule);
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

				const result = service.isApplicable(user, team);

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
				const result = service.isApplicable(user, user);

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

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([permissionA]));

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

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([teamPermissionD]));

				expect(res).toBe(false);
			});

			it('should return "false" if user has global permission', () => {
				const { user, team } = setup();

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([permissionA]));

				expect(res).toBe(false);
			});

			it('should return "false" if user has not global permission', () => {
				const { user, team } = setup();

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([permissionC]));

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

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([teamPermissionA]));

				expect(res).toBe(true);
			});

			it('should return "true" by teamRoleB', () => {
				const { user, team } = setup();

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([teamPermissionB]));

				expect(res).toBe(true);
			});

			it('should return "true" by teamRole', () => {
				const { user, team } = setup();

				const res = service.hasPermission(user, team, PermissionContextBuilder.read([teamPermissionC]));

				expect(res).toBe(true);
			});
		});
	});
});
