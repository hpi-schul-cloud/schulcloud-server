import { ExternalSourceEntity, RoleName } from '@shared/domain';
import { GroupEntity, GroupEntityProps, GroupEntityTypes, GroupValidPeriodEntity } from '@src/modules/group/entity';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';
import { systemFactory } from './system.factory';
import { userFactory } from './user.factory';

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
		],
		validPeriod: new GroupValidPeriodEntity({
			from: new Date(2023, 1),
			until: new Date(2023, 6),
		}),
		organization: schoolFactory.buildWithId(),
		externalSource: new ExternalSourceEntity({
			externalId: `externalId-${sequence}`,
			system: systemFactory.buildWithId(),
		}),
	};
});
