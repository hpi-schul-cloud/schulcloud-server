import { EntityManager } from '@mikro-orm/mongodb';
import { TestingModule, Test } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { Healthcheck, HealthcheckDO } from '@shared/domain';
import { HealthcheckRepo } from './healthcheck.repo';

describe(HealthcheckRepo.name, () => {
	const testId = 'test_healthcheck_id';
	const testUpdatedAt = new Date();
	const testEntity = new Healthcheck({ id: testId, updatedAt: testUpdatedAt });

	let module: TestingModule;
	let em: EntityManager;
	let repo: HealthcheckRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Healthcheck],
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
			it('healthcheck with given ID if present in the database', async () => {
				await em.persistAndFlush(testEntity);
				em.clear();
				const expectedDO = new HealthcheckDO(testId, testUpdatedAt);

				const foundDO = await repo.findById(testId);

				expect(foundDO).toEqual(expectedDO);
			});

			it('null healthcheck if not present in the database', async () => {
				const foundDO = await repo.findById('non_existing_healthcheck_id');

				expect(foundDO).toBeNull();
			});
		});
	});

	describe('mapHealthcheckEntityToDO', () => {
		describe('should map', () => {
			it('null entity to null domain object', () => {
				const mappedDO = repo.mapHealthcheckEntityToDO(null);

				expect(mappedDO).toBeNull();
			});

			it('entity with all the fields filled to proper domain object', () => {
				const expectedDomainObject = new HealthcheckDO(testId, testUpdatedAt);

				const mappedDO = repo.mapHealthcheckEntityToDO(testEntity);

				expect(mappedDO).toEqual(expectedDomainObject);
			});
		});
	});
});
