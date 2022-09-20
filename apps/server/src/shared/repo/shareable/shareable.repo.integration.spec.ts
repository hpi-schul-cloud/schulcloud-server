import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Shareable } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { shareableFactory } from '@shared/testing/factory/shareable.factory';
import { ShareableRepo } from './shareable.repo';

describe('ShareableRepo', () => {
	let module: TestingModule;
	let repo: ShareableRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ShareableRepo],
		}).compile();
		repo = module.get(ShareableRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Shareable);
	});

	describe('findOneByToken', () => {
		it('should find a shareable by its token', async () => {
			const shareable = shareableFactory.build();

			await em.persistAndFlush(shareable);
			em.clear();

			const result = await repo.findOneByToken(shareable.token);

			expect(result).toBeDefined();
			expect(result.id).toEqual(shareable.id);
		});
	});
});
