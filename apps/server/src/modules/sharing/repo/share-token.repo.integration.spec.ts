import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, schoolFactory, shareTokenFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
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
					provide: Logger,
					useValue: createMock<Logger>(),
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
			const school = schoolFactory.build();
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
