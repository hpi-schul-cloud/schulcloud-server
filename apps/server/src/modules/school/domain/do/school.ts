import { ValidationError } from '@shared/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { LanguageType } from '@shared/domain/interface';
import { EntityId, SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { FileStorageType, InstanceFeature, SchoolPermissions } from '../type';
import { County } from './county';
import { FederalState } from './federal-state';
import { SchoolYear } from './school-year';

interface SchoolLogo {
	dataUrl?: string;
	name?: string;
}

interface SchoolInfo {
	id: EntityId;
	name: string;
	language?: LanguageType;
	logo?: SchoolLogo;
}

export class School extends DomainObject<SchoolProps> {
	get currentYear() {
		return this.props.currentYear;
	}

	get systems(): EntityId[] {
		return this.props.systemIds;
	}

	get externalId(): string | undefined {
		return this.props.externalId;
	}

	set externalId(externalId: string | undefined) {
		this.props.externalId = externalId;
	}

	set ldapLastSync(ldapLastSync: string | undefined) {
		this.props.ldapLastSync = ldapLastSync;
	}

	public getInfo(): SchoolInfo {
		const info = {
			id: this.props.id,
			name: this.props.name,
			language: this.props.language,
			logo: this.props.logo,
		};

		return info;
	}

	public getPermissions(): SchoolPermissions | undefined {
		const { permissions } = this.props;

		return permissions;
	}

	public addInstanceFeature(feature: InstanceFeature): void {
		if (!this.props.instanceFeatures) {
			this.props.instanceFeatures = new Set();
		}
		this.props.instanceFeatures.add(feature);
	}

	public removeInstanceFeature(feature: InstanceFeature): void {
		if (this.props.instanceFeatures) {
			this.props.instanceFeatures.delete(feature);
		}
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

	public hasSystem(systemId: EntityId): boolean {
		const { systemIds } = this.props;

		const result = systemIds.includes(systemId);

		return result;
	}

	public removeSystem(systemId: EntityId) {
		this.props.systemIds = this.props.systemIds.filter((id) => id !== systemId);
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
	features: Set<SchoolFeature>;
	instanceFeatures?: Set<InstanceFeature>;
	systemIds: EntityId[];
	logo?: SchoolLogo;
	fileStorageType?: FileStorageType;
	language?: LanguageType;
	timezone?: string;
	permissions?: SchoolPermissions;
	// The enableStudentTeamCreation property is for compatibility with the existing data.
	// It can't be mapped to a feature straight-forwardly,
	// because the config value STUDENT_TEAM_CREATION has to be taken into account.
	enableStudentTeamCreation?: boolean;
	ldapLastSync?: string;
}
