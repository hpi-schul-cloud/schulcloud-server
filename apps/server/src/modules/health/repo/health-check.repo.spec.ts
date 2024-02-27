import { EntityManager } from '@mikro-orm/mongodb';
import { TestingModule, Test } from '@nestjs/testing';

import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { HealthCheckEntity } from './entity';
import { HealthCheckRepo } from './health-check.repo';

describe(HealthCheckRepo.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: HealthCheckRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [HealthCheckEntity],
				}),
			],
			providers: [HealthCheckRepo],
		}).compile();
		em = module.get(EntityManager);
		repo = module.get(HealthCheckRepo);
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
				const testId = 'test_health_check_id';

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
