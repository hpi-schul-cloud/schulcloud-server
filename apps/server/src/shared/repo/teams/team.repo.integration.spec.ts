import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, Team } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { TeamsRepo } from '@shared/repo';
import { cleanupCollections, roleFactory } from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';

describe('team repo', () => {
	let module: TestingModule;
	let repo: TeamsRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [TeamsRepo],
		}).compile();
		repo = module.get(TeamsRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		em.clear();
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Team);
	});

	describe('findById', () => {
		it('should return right keys', async () => {
			const team = teamFactory.build();

			await em.persistAndFlush([team]);
			em.clear();

			const result = await repo.findById(team.id);
			expect(Object.keys(result).sort()).toEqual(['name', 'userIds', 'updatedAt', '_id', 'createdAt'].sort());
		});

		it('should populate roles if populate is set to true', async () => {
			// Arrange
			const userId: EntityId = new ObjectId().toHexString();

			const roles3 = roleFactory.buildList(1);
			await em.persistAndFlush(roles3);

			const roles2 = roleFactory.buildList(1, { roles: roles3 });
			await em.persistAndFlush(roles2);

			const role = roleFactory.build({ roles: roles2 });
			await em.persistAndFlush(role);

			const team: Team = teamFactory.withRoleAndUserId(role, userId).buildWithId();
			await em.persistAndFlush(team);
			em.clear();

			// Act
			const result = await repo.findById(team.id, true);

			// Assert
			const teamUserRoles = result.teamUsers[0].role.roles;
			expect(teamUserRoles).toBeDefined();
			expect(teamUserRoles.toArray()).toEqual(role.roles.toArray());
			expect(teamUserRoles[0].roles.toArray()).toEqual(roles2[0].roles.toArray());
		});

		it('should return one role that matched by id', async () => {
			const teamA = teamFactory.build();
			const teamB = teamFactory.build();

			await em.persistAndFlush([teamA, teamB]);
			em.clear();

			const result = await repo.findById(teamA.id, true);

			expect(result).toMatchObject({
				id: teamA.id,
				name: teamA.name,
			});
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByUserId', () => {
		it('should return right keys', async () => {
			// Arrange
			const team = teamFactory.buildWithId();
			await em.persistAndFlush([team]);
			em.clear();

			// Act
			const result = await repo.findByUserId(team.teamUsers[0].user.id);

			// Assert
			expect(result[0]).toBeDefined();
			expect(Object.keys(result[0]).sort()).toEqual(['name', 'userIds', 'updatedAt', '_id', 'createdAt'].sort());
		});

		it('should return teams which contains a specific userId', async () => {
			// Arrange
			const teamUser = teamUserFactory.buildWithId();
			const team1 = teamFactory.withTeamUser(teamUser).build();
			const team2 = teamFactory.withTeamUser(teamUser).build();
			const team3 = teamFactory.buildWithId();
			await em.persistAndFlush([team1, team2, team3]);
			em.clear();

			// Act
			const result = await repo.findByUserId(teamUser.user.id);

			// Assert
			expect(result.length).toEqual([team1, team2].length);
			result.forEach((team: Team) => {
				expect(team.teamUsers.flatMap((user) => user.userId.id).includes(teamUser.userId.id)).toBeTruthy();
			});
			expect(result.some((team: Team) => team.id === team3.id)).toBeFalsy();
			expect(Object.keys(result[0]).sort()).toEqual(['name', 'userIds', 'updatedAt', '_id', 'createdAt'].sort());
		});
	});
});
