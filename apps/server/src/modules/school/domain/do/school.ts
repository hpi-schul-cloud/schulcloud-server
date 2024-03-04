import { ValidationError } from '@shared/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId, SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { FileStorageType, InstanceFeature, SchoolPermissions } from '../type';
import { County } from './county';
import { FederalState } from './federal-state';
import { SchoolYear } from './school-year';

interface SchoolInfo {
	id: EntityId;
	name: string;
	language?: string;
	logo_dataUrl?: string;
	logo_name?: string;
}

export class School extends DomainObject<SchoolProps> {
	private _instanceFeatures: Set<InstanceFeature> = new Set();

	public getInfo(): SchoolInfo {
		const info = {
			id: this.props.id,
			name: this.props.name,
			language: this.props.language,
			logo_dataUrl: this.props.logo_dataUrl,
			logo_name: this.props.logo_name,
		};

		return info;
	}

	public getPermissions(): SchoolPermissions | undefined {
		const { permissions } = this.props;

		return permissions;
	}

	public addInstanceFeature(feature: InstanceFeature): void {
		this._instanceFeatures.add(feature);
	}

	public get instanceFeatures(): InstanceFeature[] {
		return Array.from(this._instanceFeatures);
	}

	public removeInstanceFeature(feature: InstanceFeature): void {
		this._instanceFeatures.delete(feature);
	}

	public updateCounty(countyId: EntityId): void {
		const { county, federalState } = this.props;

		if (county) {
			throw new ValidationError('County cannot be updated, once it is set.');
		}
		const { counties } = federalState.getProps();
		const countyObject = counties?.find((item) => item.id === countyId);

		if (!countyObject) {
			throw new ValidationError('County not found.');
		}

		this.props.county = countyObject;
	}

	public updateOfficialSchoolNumber(officialSchoolNumber: string): void {
		if (this.props.officialSchoolNumber) {
			throw new ValidationError('Official school number cannot be updated, once it is set.');
		}

		this.props.officialSchoolNumber = officialSchoolNumber;
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
	features: SchoolFeature[];
	systemIds?: EntityId[];
	logo_dataUrl?: string;
	logo_name?: string;
	fileStorageType?: FileStorageType;
	language?: string;
	timezone?: string;
	permissions?: SchoolPermissions;
	// The enableStudentTeamCreation property is for compatibility with the existing data.
	// It can't be mapped to a feature straight-forwardly in the repo,
	// because the config value STUDENT_TEAM_CREATION has to be taken into account.
	enableStudentTeamCreation?: boolean;
}
