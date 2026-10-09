import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { type GroupLicenseType } from '../enum';

export interface GroupLicenseProps extends AuthorizableObject {
	groupId: EntityId;
	type: GroupLicenseType;
}

export abstract class GroupLicense<T extends GroupLicenseProps> extends DomainObject<T> {
	get groupId(): EntityId {
		return this.props.groupId;
	}

	set groupId(value: EntityId) {
		this.props.groupId = value;
	}

	get type(): GroupLicenseType {
		return this.props.type;
	}
}
