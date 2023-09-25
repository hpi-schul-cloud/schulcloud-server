import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SchoolFeatures, SchoolPurpose } from '../type';
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
	previousExternalId?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	schoolYear?: SchoolYear;
	federalState: FederalState;
	purpose?: SchoolPurpose;
	features?: SchoolFeatures[];
	// userLoginMigration?: UserLoginMigration;
	// systems?: System[];
}
