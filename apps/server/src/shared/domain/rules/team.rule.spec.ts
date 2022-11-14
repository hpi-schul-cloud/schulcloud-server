import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { Permission } from '../interface';
import PermissionContextBuilder from './permission-context.builder';

describe('TeamRule', () => {
	let orm: MikroORM;
	let service: TeamRule;
	const permissionA = 'a' as Permission;
	const permissionC = 'c' as Permission;
	const teamPermissionA = 'TA' as Permission;
	const teamPermissionB = 'TB' as Permission;
	const teamPermissionC = 'TC' as Permission;
	const teamPermissionD = 'TD' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TeamRule],
		}).compile();

		service = await module.get(TeamRule);
	});

	afterAll(async () => {
		await orm.close();
	});

	const setup = () => {
		const role = roleFactory.buildWithId({ permissions: [permissionA] });
		const teamRole1 = roleFactory.buildWithId({ permissions: [teamPermissionA] });
		const teamRole2 = roleFactory.buildWithId({ permissions: [teamPermissionB], roles: [teamRole1] });
		const teamRole = roleFactory.buildWithId({ permissions: [teamPermissionC], roles: [teamRole2] });
		const user = userFactory.buildWithId({ roles: [role] });
		const entity = teamFactory.withRoleAndUserId(teamRole, user.id).build();
		return {
			role,
			teamRole1,
			teamRole2,
			teamRole,
			user,
			entity,
		};
	};

	describe('isApplicable', () => {
		it('should return truthy', () => {
			const { user, entity } = setup();
			expect(() => service.isApplicable(user, entity)).toBeTruthy();
		});
	});

	describe('hasPermission', () => {
		it('should return "true" if user in team scope', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, PermissionContextBuilder.read([teamPermissionA]));
			expect(res).toBe(true);
		});

		it('should return "true" if user in team scope', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, PermissionContextBuilder.read([teamPermissionB]));
			expect(res).toBe(true);
		});

		it('should return "true" if user in team scope', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, PermissionContextBuilder.read([teamPermissionC]));
			expect(res).toBe(true);
		});

		it('should return "false" if user in scope but without permission', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, PermissionContextBuilder.read([teamPermissionD]));
			expect(res).toBe(false);
		});

		it('should return "false" if user has global permission', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, PermissionContextBuilder.read([permissionA]));
			expect(res).toBe(false);
		});

		it('should return "false" if user has not permission', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, PermissionContextBuilder.read([permissionC]));
			expect(res).toBe(false);
		});
	});
});
