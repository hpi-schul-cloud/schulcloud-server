import { v4 as uuidv4 } from 'uuid';

import { ImportUser, IImportUserProperties, RoleName, MatchCreator, User } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { schoolFactory } from './school.factory';
import { systemFactory } from './system.factory';
import { BaseFactory } from './base.factory';

class ImportUserFactory extends BaseFactory<ImportUser, IImportUserProperties> {
	matched(matchedBy: MatchCreator, user: User): this {
		const params: DeepPartial<IImportUserProperties> = { matchedBy, user };
		return this.params(params);
	}
}

export const importUserFactory = ImportUserFactory.define(ImportUser, ({ sequence }) => {
	return {
		school: schoolFactory.build(),
		system: systemFactory.build(),
		ldapDn: `uid=john${sequence},cn=schueler,cn=users,ou=1,dc=training,dc=ucs`,
		ldapId: uuidv4(),
		firstName: `John${sequence}`,
		lastName: `Doe${sequence}`,
		email: `user-${sequence}@example.com`,
		roleNames: [RoleName.STUDENT],
		flagged: false,
	};
});
