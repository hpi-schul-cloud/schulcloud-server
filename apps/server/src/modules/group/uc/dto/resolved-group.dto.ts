import { ExternalSource } from '@shared/domain/domainobject';
import { GroupPeriod, GroupTypes } from '../../domain';
import { ResolvedGroupUser } from './resolved-group-user';

export class ResolvedGroupDto {
	id: string;

	name: string;

	type: GroupTypes;

	users: ResolvedGroupUser[];

	externalSource?: ExternalSource;

	organizationId?: string;

	validPeriod?: GroupPeriod;

	constructor(group: ResolvedGroupDto) {
		this.id = group.id;
		this.name = group.name;
		this.type = group.type;
		this.users = group.users;
		this.externalSource = group.externalSource;
		this.organizationId = group.organizationId;
		this.validPeriod = group.validPeriod;
	}
}
