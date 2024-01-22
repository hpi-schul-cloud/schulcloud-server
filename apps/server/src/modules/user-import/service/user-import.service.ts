import { Inject, Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ImportUser, MatchCreator, SystemEntity, User } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { ImportUserRepo, LegacySystemRepo } from '@shared/repo';
import { UserService } from '../../user';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { UserMigrationIsNotEnabledLoggableException } from '../loggable';

@Injectable()
export class UserImportService {
	constructor(
		private readonly userImportRepo: ImportUserRepo,
		private readonly systemRepo: LegacySystemRepo,
		private readonly userService: UserService,
		@Inject(UserImportFeatures) private readonly userImportFeatures: IUserImportFeatures
	) {}

	public async saveImportUsers(importUsers: ImportUser[]): Promise<void> {
		await this.userImportRepo.saveImportUsers(importUsers);
	}

	public async getMigrationSystem(): Promise<SystemEntity> {
		const systemId: string = this.userImportFeatures.userMigrationSystemId;

		const system: SystemEntity = await this.systemRepo.findById(systemId);

		return system;
	}

	public checkFeatureEnabled(school: LegacySchoolDo): void {
		const enabled: boolean = this.userImportFeatures.userMigrationEnabled;
		const isLdapPilotSchool: boolean =
			!!school.features && school.features.includes(SchoolFeature.LDAP_UNIVENTION_MIGRATION);

		if (!enabled && !isLdapPilotSchool) {
			throw new UserMigrationIsNotEnabledLoggableException(school.id);
		}
	}

	public async matchUsers(importUsers: ImportUser[]): Promise<ImportUser[]> {
		const matchedImportUsers: Promise<ImportUser>[] = importUsers.map(
			async (importUser: ImportUser): Promise<ImportUser> => {
				const user: User[] = await this.userService.findUserBySchoolAndName(
					importUser.school.id,
					importUser.firstName,
					importUser.lastName
				);

				let nameCount = 0;
				importUsers.forEach((importUser2: ImportUser): void => {
					if (importUser2.firstName === importUser.firstName && importUser2.lastName === importUser.lastName) {
						nameCount += 1;
					}
				});

				if (user.length === 1 && nameCount === 1) {
					importUser.user = user[0];
					importUser.matchedBy = MatchCreator.AUTO;
				}

				return importUser;
			}
		);

		return Promise.all(matchedImportUsers);
	}
}
