import { EntityId, ExternalSource } from '@shared/domain';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { GroupTypes } from './group-types';
import { GroupUser } from './group-user';

export interface GroupProps extends AuthorizableObject {
	id: EntityId;

	name: string;

	type: GroupTypes;

	validFrom?: Date;

	validUntil?: Date;

	externalSource?: ExternalSource;

	users: GroupUser[];

	organizationId?: string;
}

export class Group extends DomainObject<GroupProps> {
	get name() {
		return this.props.name;
	}

	get users() {
		return this.props.name;
	}

	get externalSource() {
		return this.props.externalSource;
	}
}
