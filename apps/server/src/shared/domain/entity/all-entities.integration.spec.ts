import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ALL_ENTITIES } from '.';

describe('BaseRepo', () => {
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: ALL_ENTITIES })],
			providers: [],
		}).compile();

		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('When entities have index definitions', () => {
		it('should ensure indexes', async () => {
			await em.getDriver().ensureIndexes();
		});
	});
});
