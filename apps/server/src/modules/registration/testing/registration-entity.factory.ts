import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@testing/factory/entity.factory';
import { RegistrationEntity } from '../repo/entity';
import { RegistrationProps } from '../domain/do';
import { LanguageType } from '@shared/domain/interface';

export const registrationEntityFactory = EntityFactory.define<RegistrationEntity, RegistrationProps>(
	RegistrationEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			email: `user${sequence}@example.com`,
			firstName: `FirstName${sequence}`,
			lastName: `LastName${sequence}`,
			password: '',
			consent: [],
			pin: '',
			language: LanguageType.DE,
			roomIds: [new ObjectId().toHexString()],
			registrationHash: `hash${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
