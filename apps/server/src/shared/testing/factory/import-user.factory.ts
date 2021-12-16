import { v4 as uuidv4 } from 'uuid';

import { ImportUser, IImportUserProperties } from '@shared/domain';
import { schoolFactory } from './school.factory';
import { systemFactory } from './system.factory';
import { BaseFactory } from './base.factory';

export const userFactory = BaseFactory.define<ImportUser, IImportUserProperties>(ImportUser, ({ sequence }) => {
	return {
		school: schoolFactory.build(),
		system: systemFactory.build(),
		ldapDn: `uid=john${sequence},cn=schueler,cn=users,ou=1,dc=training,dc=ucs`,
		ldapId: uuidv4(),
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roleNames: [],
		match: undefined,
		flagged: false,
	};
});
