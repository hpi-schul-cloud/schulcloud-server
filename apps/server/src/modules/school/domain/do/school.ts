import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { County, FileStorageType, SchoolFeature, SchoolPermissions, SchoolPurpose } from '../type';
import { FederalState } from './federal-state';
import { SchoolYear } from './school-year';
import { System } from './system';

export class School extends DomainObject<SchoolProps> {
	public addFeature(feature: SchoolFeature): void {
		this.props.features?.add(feature);
	}

	public removeFeature(feature: SchoolFeature): void {
		this.props.features?.delete(feature);
	}

	public isInMaintenance(): boolean {
		const result = this.props.inMaintenanceSince ? this.props.inMaintenanceSince <= new Date() : false;

		return result;
	}

	public isExternal(): boolean {
		const result = !!this.props.externalId;

		return result;
	}
}

export interface SchoolProps extends AuthorizableObject {
	createdAt: Date;
	updatedAt: Date;
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
	features?: Set<SchoolFeature>;
	systems?: System[];
	logo_dataUrl?: string;
	fileStorageType?: FileStorageType;
	language?: string;
	timezone?: string;
	permissions?: SchoolPermissions;
}
