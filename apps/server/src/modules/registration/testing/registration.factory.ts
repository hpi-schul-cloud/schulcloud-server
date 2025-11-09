import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { Registration, RegistrationProps } from '../domain/do/registration.do';
import { LanguageType } from '@shared/domain/interface';

export const registrationFactory = BaseFactory.define<Registration, RegistrationProps>(Registration, ({ sequence }) => {
    const props: RegistrationProps = {
        id: new ObjectId().toHexString(),
        email: `user${sequence}@example.com`,
        firstName: `FirstName${sequence}`,
        lastName: `LastName${sequence}`,
        password: `password${sequence}`,
        consent: ['terms'],
        pin: `1234${sequence}`,
        language: LanguageType.DE,
        roomIds: [new ObjectId().toHexString()],
        registrationHash: `hash${sequence}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return props;
});
