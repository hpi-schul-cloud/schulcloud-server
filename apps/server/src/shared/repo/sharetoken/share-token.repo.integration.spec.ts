import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ShareToken } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { shareTokenFactory } from '@shared/testing/factory/share-token.factory';
import { ShareTokenRepo } from './share-token.repo';

describe('ShareTokenRepo', () => {
	let module: TestingModule;
	let repo: ShareTokenRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ShareTokenRepo],
		}).compile();
		repo = module.get(ShareTokenRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(ShareToken);
	});

	describe('findOneByToken', () => {
		it('should find a shareToken by its token', async () => {
			const shareToken = shareTokenFactory.build();

			await em.persistAndFlush(shareToken);
			em.clear();

			const result = await repo.findOneByToken(shareToken.token);

			expect(result).toBeDefined();
			expect(result.id).toEqual(shareToken.id);
		});
	});
});
