import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardExternalReferenceType, BoardNodeType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';
import { BoardNodeEntity } from './board-node.entity';
import { Context } from './embeddables';

describe('entity', () => {
	let module: TestingModule;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BaseEntityWithTimestamps, BoardNodeEntity] })],
		}).compile();

		em = module.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('context', () => {
		it('should persist the property', async () => {
			const entity = new BoardNodeEntity();
			entity.type = BoardNodeType.COLUMN_BOARD;
			entity.context = new Context({
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			});

			await em.persist(entity).flush();
			em.clear();

			const result = await em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.context).toEqual(entity.context);
		});

		it('should persist factory generated object', async () => {
			const entity = columnBoardEntityFactory.build();

			await em.persist(entity).flush();
			em.clear();

			const result = await em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.context).toEqual(entity.context);
		});
	});

	describe('contextExternalToolId', () => {
		it('should persist the property', async () => {
			const entity = new BoardNodeEntity();
			entity.type = BoardNodeType.EXTERNAL_TOOL;
			entity.contextExternalToolId = new ObjectId().toHexString();

			await em.persist(entity).flush();
			em.clear();

			const result = await em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.contextExternalToolId).toBe(entity.contextExternalToolId);
		});
	});

	describe('contentId', () => {
		it('should persist the property', async () => {
			const entity = new BoardNodeEntity();
			entity.type = BoardNodeType.H5P_ELEMENT;
			entity.contentId = new ObjectId().toHexString();

			await em.persist(entity).flush();
			em.clear();

			const result = await em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.contentId).toBe(entity.contentId);
		});
	});
});
