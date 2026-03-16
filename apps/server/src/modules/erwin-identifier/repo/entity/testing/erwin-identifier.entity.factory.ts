import { faker } from '@faker-js/faker/.';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { ReferencedEntityType } from '../../../types';
import { ErwinIdentifierEntity, ErwinIdentifierEntityProps } from '../erwin-identifier.entity';

export const erwinIdentifierEntityFactoryWithUser = DoBaseFactory.define<
	ErwinIdentifierEntity,
	ErwinIdentifierEntityProps
>(ErwinIdentifierEntity, () => {
	return {
		id: faker.string.uuid(),
		erwinId: faker.string.uuid(),
		type: ReferencedEntityType.USER,
		referencedEntityId: faker.string.uuid(),
	};
});

export const erwinIdentifierEntityFactoryWithSchool = DoBaseFactory.define<
	ErwinIdentifierEntity,
	ErwinIdentifierEntityProps
>(ErwinIdentifierEntity, () => {
	return {
		id: faker.string.uuid(),
		erwinId: faker.string.uuid(),
		type: ReferencedEntityType.SCHOOL,
		referencedEntityId: faker.string.uuid(),
	};
});
