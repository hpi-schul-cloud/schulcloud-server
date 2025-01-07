import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { School } from '@modules/school';
import { SchoolLicenseType } from '../enum';

export interface SchoolLicenseProps extends AuthorizableObject {
	school: School;
	type: SchoolLicenseType;
}

export abstract class SchoolLicense<T extends SchoolLicenseProps> extends DomainObject<T> {
	get school(): School {
		return this.props.school;
	}

	get type(): SchoolLicenseType {
		return this.props.type;
	}
}
