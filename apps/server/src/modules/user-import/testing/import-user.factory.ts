import { RoleName } from '@modules/role';
import { schoolEntityFactory } from '@modules/school/testing';
import { systemEntityFactory } from '@modules/system/testing';
import { ImportUser, ImportUserProperties, ImportUserRoleName, MatchCreator } from '@modules/user-import/entity';
import { User } from '@modules/user/repo';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { v4 as uuidv4 } from 'uuid';

class ImportUserFactory extends BaseFactory<ImportUser, ImportUserProperties> {
	matched(matchedBy: MatchCreator, user: User): this {
		const params: DeepPartial<ImportUserProperties> = { matchedBy, user };

		return this.params(params);
	}
}

export const importUserFactory = ImportUserFactory.define(ImportUser, ({ sequence }) => {
	return {
		school: schoolEntityFactory.buildWithId(),
		system: systemEntityFactory.buildWithId(),
		ldapDn: `uid=john${sequence},cn=schueler,cn=users,ou=1,dc=training,dc=ucs`,
		externalId: uuidv4(),
		firstName: `John${sequence}`,
		lastName: `Doe${sequence}`,
		email: `user-${sequence}@example.com`,
		roleNames: [RoleName.STUDENT as ImportUserRoleName],
		classNames: ['firstClass'],
		flagged: false,
	};
});
