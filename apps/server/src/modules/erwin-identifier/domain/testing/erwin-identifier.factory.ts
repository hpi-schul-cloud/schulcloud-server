import { faker } from '@faker-js/faker/.';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { ReferencedEntityType } from '../../types';
import { ErwinIdentifier, ErwinIdentifierProps } from '../do';

export const erwinIdentifierFactoryWithUser = DoBaseFactory.define<ErwinIdentifier, ErwinIdentifierProps>(
	ErwinIdentifier,
	() => {
		return {
			id: faker.string.uuid(),
			erwinId: faker.string.uuid(),
			type: ReferencedEntityType.USER,
			referencedEntityId: faker.string.uuid(),
		};
	}
);

export const erwinIdentifierFactoryWithSchool = DoBaseFactory.define<ErwinIdentifier, ErwinIdentifierProps>(
	ErwinIdentifier,
	() => {
		return {
			id: faker.string.uuid(),
			erwinId: faker.string.uuid(),
			type: ReferencedEntityType.SCHOOL,
			referencedEntityId: faker.string.uuid(),
		};
	}
);
