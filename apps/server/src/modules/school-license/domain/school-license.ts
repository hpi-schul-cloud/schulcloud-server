import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { SchoolLicenseType } from '../enum';

export interface SchoolLicenseProps extends AuthorizableObject {
	schoolId: EntityId;
	type: SchoolLicenseType;
}

export abstract class SchoolLicense<T extends SchoolLicenseProps> extends DomainObject<T> {
	get schoolId(): EntityId {
		return this.props.schoolId;
	}

	get type(): SchoolLicenseType {
		return this.props.type;
	}
}
