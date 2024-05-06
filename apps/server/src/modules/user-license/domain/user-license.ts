import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { UserLicenseType } from '../entity';

export interface UserLicenseProps extends AuthorizableObject {
	userId: EntityId;
	type: UserLicenseType;
}

export abstract class UserLicense<T extends UserLicenseProps> extends DomainObject<T> {
	get userId(): EntityId {
		return this.props.userId;
	}

	set userId(value: EntityId) {
		this.props.userId = value;
	}

	get type(): UserLicenseType {
		return this.props.type;
	}
}
