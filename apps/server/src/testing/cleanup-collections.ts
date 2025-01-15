import { EntityManager } from '@mikro-orm/mongodb';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cleanupCollections = async (em: EntityManager): Promise<void> => {
	const allCollections = await em.getConnection('write').listCollections();
	await Promise.all(
		allCollections.map(async (collectionName) => {
			await em.getConnection().deleteMany(collectionName, {});
		})
	);
};
