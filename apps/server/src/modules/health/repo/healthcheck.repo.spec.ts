import { EntityManager } from '@mikro-orm/mongodb';
import { TestingModule, Test } from '@nestjs/testing';

import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Healthcheck } from '../domain';
import { HealthcheckEntity } from './entity';
import { HealthcheckRepo } from './healthcheck.repo';

describe(HealthcheckRepo.name, () => {
	const testId = 'test_healthcheck_id';
	const testUpdatedAt = new Date();
	const testEntity = new HealthcheckEntity({ id: testId, updatedAt: testUpdatedAt });

	let module: TestingModule;
	let em: EntityManager;
	let repo: HealthcheckRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [HealthcheckEntity],
				}),
			],
			providers: [HealthcheckRepo],
		}).compile();
		em = module.get(EntityManager);
		repo = module.get(HealthcheckRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findById', () => {
		describe('should return', () => {
			it('healthcheck with given Id if present in the database', async () => {
				await em.persistAndFlush(testEntity);
				em.clear();
				const expectedDO = new Healthcheck(testId, testUpdatedAt);

				const foundDO = await repo.findById(testId);

				expect(foundDO).toEqual(expectedDO);
			});

			it('null healthcheck if not present in the database', async () => {
				const foundDO = await repo.findById('non_existing_healthcheck_id');

				expect(foundDO).toBeNull();
			});
		});
	});
});
