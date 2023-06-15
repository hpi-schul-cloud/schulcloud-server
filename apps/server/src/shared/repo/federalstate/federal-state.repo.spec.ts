import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { FederalState } from '@shared/domain';
import { cleanupCollections, federalStateFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { FederalStateRepo } from './federal-state.repo';

describe('FederalStateRepo', () => {
	let module: TestingModule;
	let repo: FederalStateRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FederalStateRepo],
		}).compile();
		repo = module.get(FederalStateRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(FederalState, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(FederalState);
	});

	describe('findByName', () => {
		it('should return existing federalState', async () => {
			const federalState: FederalState = federalStateFactory.build();
			await em.persistAndFlush(federalState);
			em.clear();

			const result = await repo.findByName(federalState.name);

			expect(result.id).toEqual(federalState.id);
		});

		it('should throw if no federalState exists', async () => {
			const federalState: FederalState = federalStateFactory.build();
			await em.persistAndFlush(federalState);
			em.clear();

			const func = () => repo.findByName('non-existing');

			await expect(func()).rejects.toThrow();
		});
	});
});
