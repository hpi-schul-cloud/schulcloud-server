import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { Registration, RegistrationProps } from '../domain/do/registration.do';

export const registrationFactory = BaseFactory.define<Registration, RegistrationProps>(Registration, ({ sequence }) => {
	const props: RegistrationProps = {
		id: new ObjectId().toHexString(),
		email: `user${sequence}@example.com`,
		firstName: `FirstName${sequence}`,
		lastName: `LastName${sequence}`,
		roomIds: [new ObjectId().toHexString()],
		registrationSecret: `hash${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return props;
});
