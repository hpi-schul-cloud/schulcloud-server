import { MongoMemoryDatabaseModule } from '@infra/database';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
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
		await module.close();
	});

	describe('defined', () => {
		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	// When we call `ensureIndexes` we get a MikroORM error when the collection already exists.
	// This is despite the ORM ignoring existing collections. That's why we create all collections
	// manually for this particular test.
	// https://github.com/mikro-orm/mikro-orm/blob/fd56714e06e39c2724a3193b8b07279b8fb6c91f/packages/mongodb/src/MongoSchemaGenerator.ts#L30
	const createCollections = async () => {
		const collections = new Set();
		Object.values(em.getMetadata().getAll()).forEach((meta) => {
			if (meta.collection) {
				collections.add(meta.collection);
			}
		});
		await Promise.all(
			Array.from(collections.values()).map(async (collection) => {
				await em
					.getDriver()
					.getConnection()
					.createCollection(collection as string);
			})
		);
	};

	describe('When entities have index definitions', () => {
		it('should ensure indexes', async () => {
			await createCollections();

			await orm.getSchemaGenerator().ensureIndexes();
		});
	});
});
