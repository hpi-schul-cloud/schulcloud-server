import { IUserLoginMigration, UserLoginMigrationEntity } from '../../domain/entity/user-login-migration.entity';
import { BaseFactory } from './base.factory';
import { schoolEntityFactory } from './school-entity.factory';
import { systemEntityFactory } from './systemEntityFactory';

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
