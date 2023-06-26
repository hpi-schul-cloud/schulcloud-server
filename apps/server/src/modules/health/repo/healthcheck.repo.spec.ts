import { EntityManager } from '@mikro-orm/mongodb';
import { TestingModule, Test } from '@nestjs/testing';

import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { HealthcheckEntity } from './entity';
import { HealthcheckRepo } from './healthcheck.repo';

describe(HealthcheckRepo.name, () => {
	const testId = 'test_healthcheck_id';

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

	describe('upsertById', () => {
		describe('should return', () => {
			it('upserted healthcheck with given ID', async () => {
				const upsertedDO = await repo.upsertById(testId);

				expect(upsertedDO.id).not.toEqual('');
				expect(upsertedDO.updatedAt).not.toEqual(new Date(0));
			});
		});
	});
});
