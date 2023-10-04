import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FederalStateEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
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

	describe('findAll', () => {
		const setup = async () => {
			const federalStates = federalStateFactory.buildListWithId(5);
			await em.persistAndFlush(federalStates);
			em.clear();

			return {
				federalStates,
			};
		};

		it('should return all federalStates', async () => {
			const { federalStates } = await setup();

			const result = await repo.findAll();

			expect(result).toMatchObject(federalStates);
		});
	});
});
