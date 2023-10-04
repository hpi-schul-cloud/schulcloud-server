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

	public get features() {
		return this.getProps().features;
	}

	public addFeature(feature: SchoolFeatures): void {
		this.props.features?.add(feature);
	}

	public removeFeature(feature: SchoolFeatures): void {
		this.props.features?.delete(feature);
	}

	public isInMaintenance(): boolean {
		const result = this.props.inMaintenanceSince ? this.props.inMaintenanceSince <= new Date() : false;

		return result;
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
	features?: Set<SchoolFeatures>;
	systems?: System[];
	// userLoginMigration?: UserLoginMigration;
}
