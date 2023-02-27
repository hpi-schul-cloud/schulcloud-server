import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { MetaCard } from '@shared/domain/entity/card.entity';
import { legacyLessonReferenceCardFactory } from '@shared/testing/factory/legacy-lesson-reference-card.factory';
import { legacyTaskReferenceCardFactory } from '@shared/testing/factory/legacy-task-reference-card.factory';
import { CardRepo } from './card-repo';

describe('CardRepo', () => {
	let module: TestingModule;
	let repo: CardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CardRepo],
		}).compile();
		repo = module.get(CardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(CardRepo, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(MetaCard);
	});

	describe('findById', () => {
		it('should persist task reference card', async () => {
			const legacyTaskCard = legacyTaskReferenceCardFactory.build();

			await em.persistAndFlush(legacyTaskCard);
			em.clear();

			const result = await repo.findById(legacyTaskCard.id);
			expect(result.id).toEqual(legacyTaskCard.id);
		});

		it('should persist lesson reference card', async () => {
			const legacyLessonCard = legacyLessonReferenceCardFactory.build();

			await em.persistAndFlush(legacyLessonCard);
			em.clear();

			const result = await repo.findById(legacyLessonCard.id);
			expect(result.id).toEqual(legacyLessonCard.id);
		});
	});

	describe('findManyByIds', () => {
		it('should find cards by their ids', async () => {
			const cards = legacyTaskReferenceCardFactory.buildList(5);

			await em.persistAndFlush(cards);
			em.clear();

			const cardIds = cards.map((c) => c.id);
			const result = await repo.findManyByIds(cardIds);

			expect(result.map((c) => c.id).sort()).toEqual(cardIds.sort());
		});
	});
});
