import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	textElementNodeFactory,
} from '@shared/testing';
import { ColumnBoardBuilder } from './column-board-builder';

describe('ColumnBoardBuilder', () => {
	let module: TestingModule;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
		}).compile();
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const root = columnBoardNodeFactory.build();
		await em.persistAndFlush(root);
		const level1 = columnNodeFactory.buildList(2, { parent: root });
		await em.persistAndFlush(level1);
		const level2 = cardNodeFactory.buildList(2, { parent: level1[0] });
		await em.persistAndFlush(level2);
		const level3 = textElementNodeFactory.buildList(2, { parent: level2[1] });
		await em.persistAndFlush(level3);
		em.clear();

		return { root, level1, level2, level3 };
	};

	describe('when converting a board boardnode', () => {
		it('should build a ColumnBoard-DO when a boardNode of type BOARD is given', async () => {
			const { root } = await setup();

			const domainObject = new ColumnBoardBuilder().build(root);

			expect(domainObject.constructor.name).toBe('ColumnBoard');
		});
	});
});
