import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { BoardExternalReferenceType, BoardNodeType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';
import { BoardNodeEntity } from './board-node.entity';
import { Context } from './embeddables';

describe('entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await MikroORM.init({
			entities: [BaseEntityWithTimestamps, BoardNodeEntity],
			clientUrl: 'mongodb://localhost:27017/boardtest',
			type: 'mongo',
			validate: true,
			allowGlobalContext: true,
		});
	});

	beforeEach(async () => {
		await orm.schema.clearDatabase();
	});

	afterAll(async () => {
		await orm.schema.dropSchema();
		await orm.close(true);
	});

	describe('context', () => {
		it('should persist the property', async () => {
			const entity = new BoardNodeEntity();
			entity.type = BoardNodeType.COLUMN_BOARD;
			entity.context = new Context({
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			});

			await orm.em.persistAndFlush(entity);
			orm.em.clear();

			const result = await orm.em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.context).toEqual(entity.context);
		});

		it('should persist factory generated object', async () => {
			const entity = columnBoardEntityFactory.build();

			await orm.em.persistAndFlush(entity);
			orm.em.clear();

			const result = await orm.em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.context).toEqual(entity.context);
		});
	});

	describe('contextExternalToolId', () => {
		it('should persist the property', async () => {
			const entity = new BoardNodeEntity();
			entity.type = BoardNodeType.EXTERNAL_TOOL;
			entity.contextExternalToolId = new ObjectId().toHexString();

			await orm.em.persistAndFlush(entity);
			orm.em.clear();

			const result = await orm.em.findOneOrFail(BoardNodeEntity, { id: entity.id });
			expect(result.contextExternalToolId).toBe(entity.contextExternalToolId);
		});
	});
});
