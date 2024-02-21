import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, schoolEntityFactory, shareTokenFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ShareTokenContextType } from '../domainobject/share-token.do';
import { ShareTokenRepo } from './share-token.repo';

describe('ShareTokenRepo', () => {
	let module: TestingModule;
	let repo: ShareTokenRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				ShareTokenRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
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

	describe('findOneByToken', () => {
		it('should find a shareToken by its token', async () => {
			const shareToken = shareTokenFactory.build();
			await repo.save(shareToken);

			const result = await repo.findOneByToken(shareToken.token);

			expect(result).toBeDefined();
			expect(result.id).toEqual(shareToken.id);
		});

		it('should include context id', async () => {
			const school = schoolEntityFactory.build();
			await em.persistAndFlush([school]);
			const shareToken = shareTokenFactory.build({
				context: { contextType: ShareTokenContextType.School, contextId: school.id },
			});
			await repo.save(shareToken);

			const result = await repo.findOneByToken(shareToken.token);

			expect(result.context?.contextId).toEqual(school.id);
		});
	});
});
