import { systemEntityFactory } from '@modules/system/testing';
import { IUserLoginMigration, UserLoginMigrationEntity } from '@shared/domain/entity';
import { BaseFactory } from '../../../testing/factory/base.factory';
import { schoolEntityFactory } from '../../../testing/factory/school-entity.factory';

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
