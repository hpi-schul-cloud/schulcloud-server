import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { TextElementNode } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cardNodeFactory, cleanupCollections, textElementFactory } from '@shared/testing';
import { BoardNodeRepo } from './board-node.repo';
import { ContentElementRepo } from './content-element.repo';

describe(ContentElementRepo.name, () => {
	let module: TestingModule;
	let repo: ContentElementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ContentElementRepo, BoardNodeRepo],
		}).compile();
		repo = module.get(ContentElementRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		const setup = async () => {
			const [textElement1, textElement2, textElement3] = textElementFactory.buildList(3);

			const cardNode = cardNodeFactory.build();
			await em.persistAndFlush(cardNode);

			return { cardId: cardNode.id, textElement1, textElement2, textElement3 };
		};

		it('should save content elements', async () => {
			const { cardId, textElement1 } = await setup();

			await repo.save(textElement1, cardId);
			em.clear();

			const result = await em.findOne(TextElementNode, textElement1.id);

			expect(result).toBeDefined();
		});

		it('should persist card order to positions', async () => {
			const { cardId, textElement1, textElement2, textElement3 } = await setup();

			await repo.save([textElement1, textElement2, textElement3], cardId);
			em.clear();

			expect((await em.findOne(TextElementNode, textElement1.id))?.position).toEqual(0);
			expect((await em.findOne(TextElementNode, textElement2.id))?.position).toEqual(1);
			expect((await em.findOne(TextElementNode, textElement3.id))?.position).toEqual(2);
		});
	});
});
