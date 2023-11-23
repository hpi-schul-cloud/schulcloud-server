import { v4 as uuidv4 } from 'uuid';

import { IImportUserRoleName, ImportUser, ImportUserProperties, MatchCreator, User } from '@shared/domain';
import { RoleName } from '@shared/domain/interface';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { systemFactory } from './system.factory';

class ImportUserFactory extends BaseFactory<ImportUser, ImportUserProperties> {
	matched(matchedBy: MatchCreator, user: User): this {
		const params: DeepPartial<ImportUserProperties> = { matchedBy, user };
		return this.params(params);
	}
}

export const importUserFactory = ImportUserFactory.define(ImportUser, ({ sequence }) => {
	return {
		school: schoolFactory.build(),
		system: systemFactory.build(),
		ldapDn: `uid=john${sequence},cn=schueler,cn=users,ou=1,dc=training,dc=ucs`,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		externalId: uuidv4() as unknown as string,
		firstName: `John${sequence}`,
		lastName: `Doe${sequence}`,
		email: `user-${sequence}@example.com`,
		roleNames: [RoleName.STUDENT as IImportUserRoleName],
		classNames: ['firstClass'],
		flagged: false,
	};
});
