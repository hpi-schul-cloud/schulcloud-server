import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SchoolPurpose } from '../type';
import { FederalState } from './federal-state';
import { SchoolYear } from './school-year';

export class School extends DomainObject<SchoolProps> {
	public get federalState() {
		return this.getProps().federalState;
	}

	public get schoolYear() {
		return this.getProps().schoolYear;
	}
}

interface SchoolProps extends AuthorizableObject {
	name: string;
	officialSchoolNumber?: string;
	externalId?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	previousExternalId?: string;
	// systems?: System[];
	// features?: SchoolFeatures[];
	schoolYear?: SchoolYear;
	// userLoginMigration?: UserLoginMigration;
	federalState: FederalState;
	purpose?: SchoolPurpose;
}
