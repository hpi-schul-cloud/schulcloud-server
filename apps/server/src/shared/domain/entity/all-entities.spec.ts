import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ALL_ENTITIES } from '.';

describe('BaseRepo', () => {
	let orm: MikroORM;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: ALL_ENTITIES })],
			providers: [],
		}).compile();

		em = module.get(EntityManager);
		orm = module.get(MikroORM);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	describe('defined', () => {
		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('When entities have index definitions', () => {
		it('should ensure indexes', async () => {
			await orm.getSchemaGenerator().ensureIndexes();
		});
	});
});
