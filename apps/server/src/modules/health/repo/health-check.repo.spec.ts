import { wrap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';

import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
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
		it('should preserve a non-ObjectId string key in storage, serialization and domain mapping', async () => {
			const id = 'health-check-string-key';
			const result = await repo.upsertById(id);
			em.clear();

			const entity = await em.findOneOrFail(HealthCheckEntity, id);
			const document = await em.getCollection<{ _id: string; updatedAt: Date }>('healthchecks').findOne({ _id: id });

			expect(document).toEqual({ _id: id, updatedAt: entity.updatedAt });
			expect(wrap(entity).toObject()).toEqual({ id, updatedAt: entity.updatedAt });
			expect(JSON.parse(JSON.stringify(entity))).toEqual({ id, updatedAt: entity.updatedAt.toISOString() });
			expect(result.id).toBe(id);
			expect(result.updatedAt).toEqual(entity.updatedAt);
		});

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
