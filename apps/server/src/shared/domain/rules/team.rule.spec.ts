import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { Role, Team, User } from '../entity';
import { Permission } from '../interface';

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
	});

	it('should return "true" if user in scope', () => {
		entity = teamFactory.withRoleAndUserId(role.name, user.id).build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { requiredPermissions: [permissionA] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = teamFactory.withRoleAndUserId(role.name, user.id).build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});
});
