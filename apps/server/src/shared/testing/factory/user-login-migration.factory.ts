import { IUserLoginMigration, UserLoginMigration } from '../../domain/entity/user-login-migration.entity';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { systemFactory } from './system.factory';

export const userLoginMigrationFactory = BaseFactory.define<UserLoginMigration, IUserLoginMigration>(
	UserLoginMigration,
	() => {
		return {
			school: schoolFactory.buildWithId(),
			startedAt: new Date('2023-04-28'),
			targetSystem: systemFactory.buildWithId(),
		};
	}
);
