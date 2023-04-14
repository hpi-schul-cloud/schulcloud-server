import { v4 as uuidv4 } from 'uuid';
import { IImportUserProperties, IImportUserRoleName, ImportUser, MatchCreator, RoleName, User } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { schoolFactory } from './school.factory';
import { systemFactory } from './system.factory';

class ImportUserFactory extends BaseEntityTestFactory<ImportUser, IImportUserProperties> {
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
