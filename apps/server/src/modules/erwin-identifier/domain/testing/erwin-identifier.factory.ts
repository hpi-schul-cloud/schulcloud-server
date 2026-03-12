import { faker } from '@faker-js/faker/.';
import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { ReferencedEntityType } from '../../types';
import { ErwinIdentifier, ErwinIdentifierProps } from '../do';

export const erwinIdentifierFactoryWithUser = DoBaseFactory.define<ErwinIdentifier, ErwinIdentifierProps>(
	ErwinIdentifier,
	() => {
		return {
			id: new ObjectId().toHexString(),
			erwinId: faker.string.uuid(),
			type: ReferencedEntityType.USER,
			referencedEntityId: new ObjectId().toHexString(),
		};
	}
);

export const erwinIdentifierFactoryWithSchool = DoBaseFactory.define<ErwinIdentifier, ErwinIdentifierProps>(
	ErwinIdentifier,
	() => {
		return {
			id: new ObjectId().toHexString(),
			erwinId: faker.string.uuid(),
			type: ReferencedEntityType.SCHOOL,
			referencedEntityId: new ObjectId().toHexString(),
		};
	}
);
