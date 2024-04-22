import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { BoardNodeEntity } from './board-node.entity';

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

	it('persists', async () => {
		const entity = new BoardNodeEntity();
		entity.type = BoardNodeType.COLUMN_BOARD;
		entity.title = 'board #1';
		entity.context = {
			type: BoardExternalReferenceType.Course,
			id: new ObjectId().toHexString(),
		};
		entity.isVisible = true;

		await orm.em.persistAndFlush(entity);
		orm.em.clear();

		expect(entity.id).toBeDefined();

		const result = await orm.em.findOneOrFail(BoardNodeEntity, { id: entity.id });

		expect(result).toBeDefined();
		expect(result.id).toEqual(entity.id);
		expect(result.context).toEqual(entity.context);
	});
});
