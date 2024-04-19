import { GroupEntity, GroupEntityProps, GroupEntityTypes, GroupValidPeriodEmbeddable } from '@modules/group/entity';
import { ExternalSourceEmbeddable } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';
import { schoolEntityFactory } from './school-entity.factory';
import { systemEntityFactory } from './systemEntityFactory';
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
		validPeriod: new GroupValidPeriodEmbeddable({
			from: new Date(2023, 1),
			until: new Date(2023, 6),
		}),
		organization: schoolEntityFactory.buildWithId(),
		externalSource: new ExternalSourceEmbeddable({
			externalId: `externalId-${sequence}`,
			system: systemEntityFactory.buildWithId(),
		}),
	};
});
