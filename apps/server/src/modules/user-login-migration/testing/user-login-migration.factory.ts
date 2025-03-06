import { schoolEntityFactory } from '@modules/school/testing';
import { systemEntityFactory } from '@modules/system/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { UserLoginMigrationEntity, IUserLoginMigration } from '../repo';

export const userLoginMigrationFactory = BaseFactory.define<UserLoginMigrationEntity, IUserLoginMigration>(
	UserLoginMigrationEntity,
	() => {
		return {
			school: schoolEntityFactory.buildWithId(),
			startedAt: new Date('2023-04-28'),
			targetSystem: systemEntityFactory.buildWithId(),
		};
	}
);
