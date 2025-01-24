import { ExternalSourceEmbeddable } from '@modules/system/entity';
import { systemEntityFactory } from '@modules/system/testing';
import { RoleName } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import { roleFactory } from '@testing/factory/role.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { userFactory } from '@testing/factory/user.factory';
import { GroupEntity, GroupEntityProps, GroupEntityTypes, GroupValidPeriodEmbeddable } from '../entity';

export const groupEntityFactory = BaseFactory.define<GroupEntity, GroupEntityProps>(GroupEntity, ({ sequence }) => {
	return {
		name: `Group ${sequence}`,
		type: GroupEntityTypes.CLASS,
		users: [
			{
				user: userFactory.buildWithId(),
				role: roleFactory.buildWithId({ name: RoleName.STUDENT }),
			},
			{
				user: userFactory.buildWithId(),
				role: roleFactory.buildWithId({ name: RoleName.TEACHER }),
			},
			{
				user: userFactory.buildWithId(),
				role: roleFactory.buildWithId({ name: RoleName.GROUPSUBSTITUTIONTEACHER }),
			},
		],
		validPeriod: new GroupValidPeriodEmbeddable({
			from: new Date(2023, 1),
			until: new Date(2023, 6),
		}),
		organization: schoolEntityFactory.buildWithId(),
		externalSource: new ExternalSourceEmbeddable({
			externalId: `externalId-${sequence}`,
			system: systemEntityFactory.buildWithId(),
			lastSyncedAt: new Date(),
		}),
	};
});
