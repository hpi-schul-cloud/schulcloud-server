import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { roleFactory } from '@modules/role/testing';
import { teamFactory, teamUserFactory } from '@modules/team/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { TeamEntity, TeamUserEntity } from './team.entity';
import { TeamRepo } from './team.repo';

describe('team repo', () => {
	let module: TestingModule;
	let repo: TeamRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [TeamEntity] })],
			providers: [TeamRepo],
		}).compile();
		repo = module.get(TeamRepo);
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
		expect(repo.entityName).toBe(TeamEntity);
	});

	describe('findById', () => {
		it('should return right keys', async () => {
			const team = teamFactory.build();

			await em.persist([team]).flush();
			em.clear();

			const result = await repo.findById(team.id);
			expect(Object.keys(result).sort()).toEqual(['name', 'userIds', 'updatedAt', '_id', 'createdAt'].sort());
		});

		it('should populate roles if populate is set to true', async () => {
			// Arrange
			const userId: EntityId = new ObjectId().toHexString();

			const roles3 = roleFactory.buildList(1);
			await em.persist(roles3).flush();

			const roles2 = roleFactory.buildList(1, { roles: roles3 });
			await em.persist(roles2).flush();

			const role = roleFactory.build({ roles: roles2 });
			await em.persist(role).flush();

			const team: TeamEntity = teamFactory.withRoleAndUserId(role, userId).buildWithId();
			await em.persist(team).flush();
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

			await em.persist([teamA, teamB]).flush();
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
			await em.persist([team]).flush();
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
			const team1 = teamFactory.withTeamUser([teamUser]).build();
			const team2 = teamFactory.withTeamUser([teamUser]).build();
			const team3 = teamFactory.buildWithId();
			await em.persist([team1, team2, team3]).flush();
			em.clear();

			// Act
			const result = await repo.findByUserId(teamUser.user.id);

			// Assert
			expect(result.length).toEqual([team1, team2].length);
			result.forEach((team: TeamEntity) => {
				expect(team.teamUsers.flatMap((user) => user.userId.id).includes(teamUser.userId.id)).toBeTruthy();
			});
			expect(result.some((team: TeamEntity) => team.id === team3.id)).toBeFalsy();
			expect(Object.keys(result[0]).sort()).toEqual(['name', 'userIds', 'updatedAt', '_id', 'createdAt'].sort());
		});
	});

	describe('removeUserReference', () => {
		const setup = async () => {
			const teamUser1: TeamUserEntity = teamUserFactory.buildWithId();
			const teamUser2: TeamUserEntity = teamUserFactory.buildWithId();
			const team1 = teamFactory.withTeamUser([teamUser1, teamUser2]).buildWithId();
			const team2 = teamFactory.withTeamUser([teamUser1, teamUser2]).buildWithId();
			const team3 = teamFactory.withTeamUser([teamUser1]).buildWithId();
			const team4 = teamFactory.withTeamUser([teamUser2]).buildWithId();

			await em.persist([team1, team2, team3, team4]).flush();
			em.clear();

			return { teamUser1, teamUser2, team1, team2, team3, team4 };
		};

		it('should return number of updated teams', async () => {
			const { teamUser1 } = await setup();

			const result = await repo.removeUserReferences(teamUser1.user.id);

			expect(result).toEqual(3);
		});

		it('should actually remove the user reference from the teams', async () => {
			const { teamUser1 } = await setup();

			await repo.removeUserReferences(teamUser1.user.id);

			const result1 = await repo.findByUserId(teamUser1.user.id);
			expect(result1).toHaveLength(0);
		});

		it('should not remove other users from same teams', async () => {
			const { teamUser1, teamUser2, team1 } = await setup();

			await repo.removeUserReferences(teamUser1.user.id);

			const team = await repo.findById(team1.id, true);
			expect(team.teamUsers.length).toEqual(1);
			expect(team.teamUsers[0].userId.id).toEqual(teamUser2.user.id);
		});
	});
});
