import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { Role, Team, User } from '../entity';
import { Permission } from '../interface';
import PermissionContextBuilder from './permission-context.builder';

describe('TeamRule', () => {
	let orm: MikroORM;
	let service: TeamRule;
	let user: User;
	let entity: Team;
	let role: Role;
	const permissionA = 'a' as Permission;
	const permissionC = 'c' as Permission;

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

	beforeEach(() => {
		role = roleFactory.build({ permissions: [permissionA] });
		user = userFactory.build({ roles: [role] });
		entity = teamFactory.withRoleAndUserId(role, user.id).build();
	});

	describe('isApplicable', () => {
		it('should return truthy', () => {
			expect(() => service.isApplicable(entity.teamUsers[0].user, entity)).toBeTruthy();
		});
	});

	describe('hasPermission', () => {
		it('should return "true" if user in scope', () => {
			const res = service.hasPermission(entity.teamUsers[0].user, entity, PermissionContextBuilder.read([permissionA]));
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			const res = service.hasPermission(entity.teamUsers[0].user, entity, PermissionContextBuilder.read([permissionC]));
			expect(res).toBe(false);
		});
	});
});
