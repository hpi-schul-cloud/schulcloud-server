import { LegacySchoolService } from '@modules/legacy-school';
import { System, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { ImportUser, MatchCreator, SchoolEntity, User } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { ImportUserRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { UserMigrationCanceledLoggable, UserMigrationIsNotEnabled } from '../loggable';
import { UserImportConfig } from '../user-import-config';

@Injectable()
export class UserImportService {
	constructor(
		private readonly configService: ConfigService<UserImportConfig, true>,
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
		const systemId: string = this.configService.get('FEATURE_USER_MIGRATION_SYSTEM_ID');

		const system: System = await this.systemService.findByIdOrFail(systemId);

		return system;
	}

	public checkFeatureEnabled(school: LegacySchoolDo): void {
		const enabled = this.configService.get<boolean>('FEATURE_USER_MIGRATION_ENABLED');
		const isLdapPilotSchool = school.features && school.features.includes(SchoolFeature.LDAP_UNIVENTION_MIGRATION);

		if (!enabled && !isLdapPilotSchool) {
			this.logger.warning(new UserMigrationIsNotEnabled());
			throw new InternalServerErrorException('User Migration not enabled');
		}
	}

	public async matchUsers(importUsers: ImportUser[], userLoginMigration: UserLoginMigrationDO): Promise<ImportUser[]> {
		const importUserMap: Map<string, number> = new Map();

		importUsers.forEach((importUser) => {
			const key = `${importUser.school.id}_${importUser.firstName}_${importUser.lastName}`;
			const count = importUserMap.get(key) || 0;
			importUserMap.set(key, count + 1);
		});

		const matchedImportUsers: ImportUser[] = await Promise.all(
			importUsers.map(async (importUser: ImportUser): Promise<ImportUser> => {
				const users: User[] = await this.userService.findUserBySchoolAndName(
					importUser.school.id,
					importUser.firstName,
					importUser.lastName
				);

				const unmigratedUsers: User[] = users.filter(
					(user: User) => !user.lastLoginSystemChange || user.lastLoginSystemChange < userLoginMigration.startedAt
				);

				const key = `${importUser.school.id}_${importUser.firstName}_${importUser.lastName}`;

				if (users.length === 1 && unmigratedUsers.length === 1 && importUserMap.get(key) === 1) {
					importUser.user = unmigratedUsers[0];
					importUser.matchedBy = MatchCreator.AUTO;
				}

				return importUser;
			})
		);

		return matchedImportUsers;
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
}
