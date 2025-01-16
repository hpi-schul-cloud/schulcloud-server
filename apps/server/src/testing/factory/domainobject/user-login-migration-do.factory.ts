import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { DoBaseFactory } from './do-base.factory';

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
