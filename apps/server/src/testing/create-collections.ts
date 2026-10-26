// When we call `ensureIndexes` we get a MikroORM error when the collection already exists.
// This is despite the ORM ignoring existing collections. That's why we create all collections
// manually for this particular test.

import { type EntityManager } from '@mikro-orm/mongodb';

// https://github.com/mikro-orm/mikro-orm/blob/fd56714e06e39c2724a3193b8b07279b8fb6c91f/packages/mongodb/src/MongoSchemaGenerator.ts#L30
export const createCollections = async (em: EntityManager): Promise<void> => {
	const collections = new Set<string>();
	for (const meta of em.getMetadata().getAll().values()) {
		if (meta.collection) {
			collections.add(meta.collection);
		}
	}
	await Promise.all(
		Array.from(collections.values()).map(async (collection) => {
			await em.getConnection().getDb().createCollection(collection);
		})
	);
};
