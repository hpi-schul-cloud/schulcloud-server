import { NotFoundError, NullCacheAdapter } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FederalState } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, federalStateFactory } from '@shared/testing';
import { FederalStateRepo } from './federalstate.repo';

describe('federalstate repo', () => {
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

	describe('when FederalStateRepo is instantiated', () => {
		it('should be defined', () => {
			expect(repo).toBeDefined();
			expect(typeof repo.findById).toEqual('function');
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(FederalState);
		});
	});

	describe('when 2 federalstates are persisted', () => {
		const setup = async () => {
			const fsA = federalStateFactory.build();
			const fsB = federalStateFactory.build();

			await em.persistAndFlush([fsA, fsB]);
			return [fsA, fsB];
		};

		it('findById should return right keys', async () => {
			const [fsA] = await setup();

			const result = await repo.findById(fsA.id);
			expect(Object.keys(result).sort()).toEqual(['_id', 'abbreviation', 'counties', 'logoUrl', 'name']);
		});

		it('findById should return one federalstate that matched by id', async () => {
			const [fsA] = await setup();

			const result = await repo.findById(fsA.id);
			expect(result).toEqual(fsA);
		});

		it('findById should throw an error if federalstates by id doesnt exist', async () => {
			const [fsA] = await setup();
			const idB = new ObjectId().toHexString();

			await em.persistAndFlush([fsA]);
			await expect(repo.findById(idB)).rejects.toThrow(NotFoundError);
		});

		it('findByIds should return federalstates that matched by ids', async () => {
			const [fsA, fsB] = await setup();

			const result: FederalState[] = await repo.findByIds([fsA.id, fsB.id]);
			expect(result).toContainEqual(fsA);
			expect(result).toContainEqual(fsB);
		});
	});
});
