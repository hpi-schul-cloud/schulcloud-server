import { EntityManager } from '@mikro-orm/core';

export const getFieldName = (em: EntityManager, prop: string, entityName: string): string => {
	const metadata = em.getMetadata();
	const fieldName = metadata.find(entityName)?.properties[prop]?.fieldNames[0];
	if (!fieldName) {
		throw new Error(`Field name for ${prop} not found.`);
	}

	return fieldName;
};
