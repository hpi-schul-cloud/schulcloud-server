import { EntityId } from '@shared/domain';
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

	public isEligibleForExternalInvite(ownSchoolId: EntityId): boolean {
		const hasEligiblePurpose =
			this.props.purpose !== SchoolPurpose.EXPERT && this.props.purpose !== SchoolPurpose.TOMBSTONE;

		const isNotOwnSchool = this.props.id !== ownSchoolId;

		const result = hasEligiblePurpose && isNotOwnSchool;

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
	logo_name?: string;
	fileStorageType?: FileStorageType;
	language?: string;
	timezone?: string;
	permissions?: SchoolPermissions;
}
