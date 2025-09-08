import { DoBaseFactory } from '@testing/factory/domainobject';
import { UserLoginMigrationDO } from '../domain';

export const userLoginMigrationDOFactory = DoBaseFactory.define<UserLoginMigrationDO, UserLoginMigrationDO>(
	UserLoginMigrationDO,
	({ sequence }) => {
		return {
			schoolId: `schoolId-${sequence}`,
			targetSystemId: 'targetSystemId',
			startedAt: new Date('2023-05-01'),
		};
	}
);
