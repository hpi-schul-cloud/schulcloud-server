import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalSource } from '@shared/domain/domainobject';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import { Group, GroupProps, GroupTypes, GroupPeriod } from '../domain';

export const groupFactory = DomainObjectFactory.define<Group, GroupProps>(Group, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `Group ${sequence}`,
		type: GroupTypes.CLASS,
		users: [
			{
				userId: new ObjectId().toHexString(),
				roleId: new ObjectId().toHexString(),
			},
		],
		validPeriod: new GroupPeriod({
			from: new Date(2023, 1),
			until: new Date(2023, 6),
		}),
		organizationId: new ObjectId().toHexString(),
		externalSource: new ExternalSource({
			externalId: `externalId-${sequence}`,
			systemId: new ObjectId().toHexString(),
			lastSyncedAt: new Date(),
		}),
	};
});
