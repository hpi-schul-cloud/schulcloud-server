import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { RegistrationPinEntity, RegistrationPinEntityProps } from '../../registration-pin.entity';

export const registrationPinEntityFactory = BaseFactory.define<RegistrationPinEntity, RegistrationPinEntityProps>(
	RegistrationPinEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			email: `name-${sequence}@schul-cloud.org`,
			pin: `123-${sequence}`,
			verified: false,
			importHash: `importHash-${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
