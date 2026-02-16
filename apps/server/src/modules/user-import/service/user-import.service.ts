import { Logger } from '@core/logger';
import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { SchoolFeature } from '@modules/school/domain';
import { SchoolEntity } from '@modules/school/repo';
import { System, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { UserLoginMigrationDO } from '@modules/user-login-migration';
import { User } from '@modules/user/repo';
import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UserAlreadyAssignedToImportUserError } from '../domain/error';
import { ImportUser, MatchCreator } from '../entity';
import {
	SchoolIdDoesNotMatchWithUserSchoolId,
	UserMigrationCanceledLoggable,
	UserMigrationIsNotEnabled,
} from '../loggable';
import { ImportUserRepo } from '../repo/import-user.repo';
import { USER_IMPORT_CONFIG_TOKEN, UserImportConfig } from '../user-import-config';

@Injectable()
export class UserImportService {
	constructor(
		@Inject(USER_IMPORT_CONFIG_TOKEN)
		private readonly userImportConfig: UserImportConfig,
		private readonly userImportRepo: ImportUserRepo,
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly logger: Logger,
		private readonly schoolService: LegacySchoolService
	) {}

	public async saveImportUsers(importUsers: ImportUser[]): Promise<void> {
		await this.userImportRepo.saveImportUsers(importUsers);
	}

	public async getMigrationSystem(): Promise<System> {
		const systemId: string = this.userImportConfig.featureUserMigrationSystemId;

		const system: System = await this.systemService.findByIdOrFail(systemId);

		return system;
	}

	public checkFeatureEnabledAndIsLdapPilotSchool(school: LegacySchoolDo): void {
		const enabled = this.userImportConfig.featureUserMigrationEnabled;
		const isLdapPilotSchool = school.features && school.features.includes(SchoolFeature.LDAP_UNIVENTION_MIGRATION);

		if (!enabled && !isLdapPilotSchool) {
			this.logger.warning(new UserMigrationIsNotEnabled());
			throw new InternalServerErrorException('User Migration not enabled');
		}
	}

	public async matchUsers(
		importUsers: ImportUser[],
		userLoginMigration: UserLoginMigrationDO,
		matchByPreferredName: boolean
	): Promise<ImportUser[]> {
		const importUserMap: Map<string, number> = new Map();

		importUsers.forEach((importUser: ImportUser): void => {
			const firstName: string = this.getFirstNameForMatching(importUser, matchByPreferredName);
			const key = `${importUser.school.id}_${firstName}_${importUser.lastName}`;
			const count = importUserMap.get(key) || 0;
			importUserMap.set(key, count + 1);
		});

		const matchedImportUsers: ImportUser[] = await Promise.all(
			importUsers.map(async (importUser: ImportUser): Promise<ImportUser> => {
				const firstName: string = this.getFirstNameForMatching(importUser, matchByPreferredName);
				const users: User[] = await this.userService.findUserBySchoolAndName(
					importUser.school.id,
					firstName,
					importUser.lastName
				);

				const unmigratedUsers: User[] = users.filter(
					(user: User) => !user.lastLoginSystemChange || user.lastLoginSystemChange < userLoginMigration.startedAt
				);

				const key = `${importUser.school.id}_${firstName}_${importUser.lastName}`;

				if (users.length === 1 && unmigratedUsers.length === 1 && importUserMap.get(key) === 1) {
					importUser.user = unmigratedUsers[0];
					importUser.matchedBy = MatchCreator.AUTO;
				}

				return importUser;
			})
		);

		return matchedImportUsers;
	}

	private getFirstNameForMatching(importUser: ImportUser, matchByPreferredName: boolean): string {
		return matchByPreferredName && importUser.preferredName ? importUser.preferredName : importUser.firstName;
	}

	public async deleteImportUsersBySchool(school: SchoolEntity): Promise<void> {
		await this.userImportRepo.deleteImportUsersBySchool(school);
	}

	public async resetMigrationForUsersSchool(currentUser: User, school: LegacySchoolDo): Promise<void> {
		await this.userImportRepo.deleteImportUsersBySchool(currentUser.school);

		school.inUserMigration = undefined;
		school.inMaintenanceSince = undefined;

		await this.schoolService.save(school, true);

		this.logger.notice(new UserMigrationCanceledLoggable(school));
	}

	public validateSameSchool(schoolId: EntityId, importUser: ImportUser, userMatch: User): void {
		if (schoolId !== userMatch.school.id || schoolId !== importUser.school.id) {
			this.logger.warning(
				new SchoolIdDoesNotMatchWithUserSchoolId(userMatch.school.id, importUser.school.id, schoolId)
			);
			throw new ForbiddenException('not same school');
		}
	}

	public checkUserIsAlreadyAssigned(hasMatch: ImportUser | null): void {
		if (hasMatch !== null) {
			throw new UserAlreadyAssignedToImportUserError();
		}
	}
}
