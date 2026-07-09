import { EntityManager } from '@mikro-orm/mongodb';

export const cleanupCollections = async (em: EntityManager | undefined): Promise<void> => {
	if (!em) {
		return;
	}

	const allCollections = await em.getConnection('write').listCollections();
	await Promise.all(
		allCollections.map(async (collectionName) => {
			await em.getConnection().deleteMany(collectionName, {});
		})
	);
};
