import { ExternalSource } from '@shared/domain/domainobject/external-source';
import { Group, GroupProps } from '@src/modules/group/domain/group';
import { GroupTypes } from '@src/modules/group/domain/group-types';
import { ObjectId } from 'bson';
import { DomainObjectFactory } from '../domain-object.factory';

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
		validFrom: new Date(2023, 1),
		validUntil: new Date(2023, 6),
		organizationId: new ObjectId().toHexString(),
		externalSource: new ExternalSource({
			externalId: `externalId-${sequence}`,
			systemId: new ObjectId().toHexString(),
		}),
	};
});
