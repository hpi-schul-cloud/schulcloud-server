import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing/school-entity.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ShareTokenContextType } from '../domainobject/share-token.do';
import { ShareToken } from '../entity/share-token.entity';
import { shareTokenDOFactory } from '../testing/share-token.do.factory';
import { ShareTokenRepo } from './share-token.repo';

describe('ShareTokenRepo', () => {
	let module: TestingModule;
	let repo: ShareTokenRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ShareToken, SchoolEntity] })],
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
			const shareToken = shareTokenDOFactory.build();
			await repo.save(shareToken);

			const result = await repo.findOneByToken(shareToken.token);

			expect(result).toBeDefined();
			expect(result.id).toEqual(shareToken.id);
		});

		it('should include context id', async () => {
			const school = schoolEntityFactory.build();
			await em.persist([school]).flush();
			const shareToken = shareTokenDOFactory.build({
				context: { contextType: ShareTokenContextType.School, contextId: school.id },
			});
			await repo.save(shareToken);

			const result = await repo.findOneByToken(shareToken.token);

			expect(result.context?.contextId).toEqual(school.id);
		});
	});
});
