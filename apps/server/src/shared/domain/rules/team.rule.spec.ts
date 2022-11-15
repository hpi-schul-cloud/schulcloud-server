import { MikroORM } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { Role, Team, User } from '../entity';
import { Permission } from '../interface';
import { AuthorizationContextBuilder } from './authorization-context.builder';

describe('TeamRule', () => {
	let orm: MikroORM;
	let service: TeamRule;
	let user: User;
	let entity: Team;
	let role: Role;
	let teamRole: Role;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
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
		teamRole = roleFactory.build({ permissions: [permissionB] });
		user = userFactory.build({ roles: [role] });
		entity = teamFactory.withRoleAndUserId(teamRole, user.id).build();
	});

	describe('isApplicable', () => {
		it('should return truthy', () => {
			expect(() => service.isApplicable(entity.teamUsers[0].user, entity)).toBeTruthy();
		});
	});

	describe('hasPermission', () => {
		it('should return "true" if user in scope', () => {
			const res = service.hasPermission(
				entity.teamUsers[0].user,
				entity,
				AuthorizationContextBuilder.read([permissionB])
			);
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			const res = service.hasPermission(
				entity.teamUsers[0].user,
				entity,
				AuthorizationContextBuilder.read([permissionC])
			);
			expect(res).toBe(false);
		});

		it('should throw error if entity was not found', () => {
			const notFoundUser = userFactory.build({ roles: [role] });
			expect(() =>
				service.hasPermission(notFoundUser, entity, AuthorizationContextBuilder.read([permissionA]))
			).toThrow(new InternalServerErrorException('Cannot find user in team'));
		});
	});
});
