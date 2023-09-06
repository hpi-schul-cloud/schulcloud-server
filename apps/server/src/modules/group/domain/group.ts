import { EntityId, ExternalSource } from '@shared/domain';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { GroupTypes } from './group-types';
import { GroupUser } from './group-user';

export interface GroupProps extends AuthorizableObject {
	id: EntityId;

	name: string;

	type: GroupTypes;

	validFrom: Date;

	validUntil: Date;

	externalSource?: ExternalSource;

	users: GroupUser[];

	organizationId?: string;
}

export class Group extends DomainObject<GroupProps> {
	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get validFrom(): Date {
		return this.props.validFrom;
	}

	set validFrom(value: Date) {
		this.props.validFrom = value;
	}

	get validUntil(): Date {
		return this.props.validUntil;
	}

	set validUntil(value: Date) {
		this.props.validUntil = value;
	}
}
