import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ExternalSourceEmbeddable } from '@modules/system/repo';
import { systemEntityFactory } from '@modules/system/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { GroupEntity, GroupEntityProps, GroupEntityTypes, GroupValidPeriodEmbeddable } from '../entity';

class GroupEntityFactory extends BaseFactory<GroupEntity, GroupEntityProps> {
	public withTypeRoom(): this {
		const params: DeepPartial<GroupEntityProps> = { type: GroupEntityTypes.ROOM };

		return this.params(params);
	}

	public withTypeClass(): this {
		const params: DeepPartial<GroupEntityProps> = { type: GroupEntityTypes.CLASS };

		return this.params(params);
	}

	public withTypeCourse(): this {
		const params: DeepPartial<GroupEntityProps> = { type: GroupEntityTypes.COURSE };

		return this.params(params);
	}

	public withTypeOther(): this {
		const params: DeepPartial<GroupEntityProps> = { type: GroupEntityTypes.OTHER };

		return this.params(params);
	}
}

export const groupEntityFactory = GroupEntityFactory.define(GroupEntity, ({ sequence }) => {
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
