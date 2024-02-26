import { EntityManager } from '@mikro-orm/mongodb';
import { TestingModule, Test } from '@nestjs/testing';

import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { HealthcheckEntity } from './entity';
import { HealthcheckRepo } from './healthcheck.repo';

describe(HealthcheckRepo.name, () => {
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
		describe('when called with some ID', () => {
			const setup = () => {
				const testId = 'test_healthcheck_id';

				return { testId };
			};

			it('should return valid object', async () => {
				const { testId } = setup();

				const upsertedDO = await repo.upsertById(testId);

				expect(upsertedDO.id).not.toEqual('');
				expect(upsertedDO.updatedAt).not.toEqual(new Date(0));
			});
		});
	});
});
