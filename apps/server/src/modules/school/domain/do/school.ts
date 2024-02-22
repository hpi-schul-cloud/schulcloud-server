import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId, SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { FileStorageType, SchoolPermissions } from '../type';
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

	public addFeature(feature: SchoolFeature): void {
		this.props.features.add(feature);
	}

	public removeFeature(feature: SchoolFeature): void {
		this.props.features.delete(feature);
	}

	public getPermissions(): SchoolPermissions | undefined {
		const { permissions } = this.props;

		return permissions;
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

	public canStudentCreateTeam(configValue: string): boolean {
		return (
			configValue === 'enabled' ||
			(configValue === 'opt-in' && this.props.enableStudentTeamCreation) ||
			// It is necessary to check enableStudentTeamCreation to be not false here,
			// because it being undefined means that the school has not opted out yet.
			(configValue === 'opt-out' && this.props.enableStudentTeamCreation !== false)
		);
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
