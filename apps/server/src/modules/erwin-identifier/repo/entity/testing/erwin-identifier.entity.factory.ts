import { faker } from '@faker-js/faker/.';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { ObjectId } from 'bson';
import { ReferencedEntityType } from '../../../types';
import { ErwinIdentifierEntity, ErwinIdentifierEntityProps } from '../erwin-identifier.entity';

export const erwinIdentifierEntityFactoryWithUser = DoBaseFactory.define<
	ErwinIdentifierEntity,
	ErwinIdentifierEntityProps
>(ErwinIdentifierEntity, () => {
	return {
		id: new ObjectId().toHexString(),
		erwinId: faker.string.uuid(),
		type: ReferencedEntityType.USER,
		referencedEntityId: new ObjectId().toHexString(),
	};
});

export const erwinIdentifierEntityFactoryWithSchool = (): ErwinIdentifierEntity =>
	erwinIdentifierEntityFactoryWithUser.build({ type: ReferencedEntityType.SCHOOL });
