import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FederalStateEntity } from '@shared/domain/entity';
import { cleanupCollections, federalStateFactory } from '@shared/testing';
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
		await em.nativeDelete(FederalStateEntity, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(FederalStateEntity);
	});

	describe('findByName', () => {
		const setup = async () => {
			const federalState: FederalStateEntity = federalStateFactory.build();
			await em.persistAndFlush(federalState);
			em.clear();

			return {
				federalState,
			};
		};

		it('should return existing federalState', async () => {
			const { federalState } = await setup();

			const result = await repo.findByName(federalState.name);

			expect(result.id).toEqual(federalState.id);
		});

		it('should throw if no federalState exists', async () => {
			await setup();

			const func = () => repo.findByName('non-existing');

			await expect(func()).rejects.toThrow();
		});
	});
});
