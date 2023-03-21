import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskCard } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	richTextCardElementFactory,
	taskCardFactory,
	taskFactory,
} from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { TaskCardRepo } from './task-card.repo';

describe('TaskCardRepo', () => {
	let module: TestingModule;
	let repo: TaskCardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [TaskCardRepo],
		}).compile();
		repo = module.get(TaskCardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(TaskCard, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(TaskCard);
	});

	describe('findById', () => {
		it('should load task card with content', async () => {
			const richTextCardElement = richTextCardElementFactory.build();
			const taskCard = taskCardFactory.build({ cardElements: [richTextCardElement] });
			await em.persistAndFlush(taskCard);

			em.clear();

			const result = await repo.findById(taskCard.id);
			expect(result.id).toEqual(taskCard.id);
		});

		it('should populate all elements correctly', async () => {
			const course = courseFactory.build();
			const task = taskFactory.build({ course });
			const richTextCardElement = richTextCardElementFactory.build();
			const taskCard = taskCardFactory.build({ task, cardElements: [richTextCardElement] });
			await repo.save(taskCard);

			em.clear();

			const result = await repo.findById(taskCard.id);
			expect(result.cardElements).toBeDefined();
			expect(result.task).toBeDefined();
			expect(result.task.course).toBeDefined();
		});
	});
});
