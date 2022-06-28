import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Team } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { TeamsRepo } from '@shared/repo';
import { teamFactory } from '@shared/testing/factory/team.factory';

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
			const result = await repo.findById(team.id);
			expect(Object.keys(result).sort()).toEqual(['name', 'userIds', 'updatedAt', '_id', 'createdAt'].sort());
		});

		it('should return one role that matched by id', async () => {
			const teamA = teamFactory.build();
			const teamB = teamFactory.build();

			await em.persistAndFlush([teamA, teamB]);
			const result = await repo.findById(teamA.id, true);
			expect(result).toEqual(teamA);
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});
	});
});
