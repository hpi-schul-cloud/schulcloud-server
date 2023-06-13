import { NotFoundError, NullCacheAdapter } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FederalState } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, federalStateFactory } from '@shared/testing';
import { FederalStateRepo } from './federalstate.repo';

describe('role repo', () => {
	let module: TestingModule;
	let repo: FederalStateRepo;
	let em: EntityManager;

	beforeAll(async () => {
		// em.clear do not clear the resultCache, it must be disabled for this test
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ resultCache: { adapter: NullCacheAdapter } })],
			providers: [FederalStateRepo],
		}).compile();
		repo = module.get(FederalStateRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(FederalState, {});
		em.clear();
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(FederalState);
	});

	describe('findById', () => {
		it('should return right keys', async () => {
			const fsA = federalStateFactory.build();

			await em.persistAndFlush([fsA]);
			const result = await repo.findById(fsA.id);
			expect(Object.keys(result).sort()).toEqual(['_id', 'abbreviation', 'counties', 'logoUrl', 'name']);
		});

		it('should return one role that matched by id', async () => {
			const fsA = federalStateFactory.build();
			const fsB = federalStateFactory.build();

			await em.persistAndFlush([fsA, fsB]);
			const result = await repo.findById(fsA.id);
			expect(result).toEqual(fsA);
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idB = new ObjectId().toHexString();
			const fsA = federalStateFactory.build();

			await em.persistAndFlush([fsA]);
			await expect(repo.findById(idB)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByIds', () => {
		it('should return roles that matched by ids', async () => {
			const fsA = federalStateFactory.build();
			const fsB = federalStateFactory.build();

			await em.persistAndFlush([fsA, fsB]);
			const result: FederalState[] = await repo.findByIds([fsA.id, fsB.id]);
			expect(result).toContainEqual(fsA);
			expect(result).toContainEqual(fsB);
		});
	});
});
