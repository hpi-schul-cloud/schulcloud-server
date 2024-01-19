import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ImportUser, SystemEntity } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { ImportUserRepo, LegacySystemRepo } from '@shared/repo';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { UserMigrationIsNotEnabledLoggableException } from '../loggable';

@Injectable()
export class UserImportService {
	constructor(
		private readonly userImportRepo: ImportUserRepo,
		private readonly systemRepo: LegacySystemRepo,
		@Inject(UserImportFeatures) private readonly userImportFeatures: IUserImportFeatures
	) {}

	public async saveImportUsers(importUsers: ImportUser[]): Promise<void> {
		await this.userImportRepo.saveImportUsers(importUsers);
	}

	public async getMigrationSystem(): Promise<SystemEntity> {
		const systemId = this.userImportFeatures.userMigrationSystemId;
		const system = await this.systemRepo.findById(systemId);
		return system;
	}

	public checkFeatureEnabled(school: LegacySchoolDo): void | never {
		const enabled = this.userImportFeatures.userMigrationEnabled;
		const isLdapPilotSchool = school.features && school.features.includes(SchoolFeature.LDAP_UNIVENTION_MIGRATION);
		if (!enabled && !isLdapPilotSchool) {
			throw new UserMigrationIsNotEnabledLoggableException(school.id);
		}
	}
}
