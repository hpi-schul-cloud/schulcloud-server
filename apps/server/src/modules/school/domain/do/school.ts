import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { County, SchoolFeatures, SchoolPurpose } from '../type';
import { FederalState } from './federal-state';
import { SchoolYear } from './school-year';
import { System } from './system';

export class School extends DomainObject<SchoolProps> {
	public get currentYear() {
		return this.getProps().currentYear;
	}

	public get federalState() {
		return this.getProps().federalState;
	}

	public get systems() {
		return this.getProps().systems;
	}
}

interface SchoolProps extends AuthorizableObject {
	name: string;
	officialSchoolNumber?: string;
	externalId?: string;
	previousExternalId?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	currentYear?: SchoolYear;
	federalState: FederalState;
	county?: County;
	purpose?: SchoolPurpose;
	features?: SchoolFeatures[];
	systems?: System[];
	// userLoginMigration?: UserLoginMigration;
}
