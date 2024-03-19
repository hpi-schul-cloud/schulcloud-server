import { MikroORM } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
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

		await orm.em.persistAndFlush(entity);
		orm.em.clear();

		expect(entity.id).toBeDefined();

		const result = await orm.em.findOneOrFail(BoardNodeEntity, { id: entity.id });

		expect(result).toBeDefined();
		expect(result.id).toEqual(entity.id);
	});
});
