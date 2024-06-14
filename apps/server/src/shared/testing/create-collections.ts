// When we call `ensureIndexes` we get a MikroORM error when the collection already exists.
// This is despite the ORM ignoring existing collections. That's why we create all collections
// manually for this particular test.

import { EntityManager } from '@mikro-orm/mongodb';

// https://github.com/mikro-orm/mikro-orm/blob/fd56714e06e39c2724a3193b8b07279b8fb6c91f/packages/mongodb/src/MongoSchemaGenerator.ts#L30
export const createCollections = async (em: EntityManager) => {
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
