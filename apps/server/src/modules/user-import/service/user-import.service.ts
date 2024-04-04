import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ImportUser, MatchCreator, SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { ImportUserRepo, LegacySystemRepo } from '@shared/repo';
import { UserService } from '@modules/user';
import { Logger } from '@src/core/logger';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { UserMigrationIsNotEnabled } from '../loggable';

@Injectable()
export class UserImportService {
	constructor(
		private readonly userImportRepo: ImportUserRepo,
		private readonly systemRepo: LegacySystemRepo,
		private readonly userService: UserService,
		@Inject(UserImportFeatures) private readonly userImportFeatures: IUserImportFeatures,
		private readonly logger: Logger
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
		const enabled = this.userImportFeatures.userMigrationEnabled;
		const isLdapPilotSchool = school.features && school.features.includes(SchoolFeature.LDAP_UNIVENTION_MIGRATION);

		if (!enabled && !isLdapPilotSchool) {
			this.logger.warning(new UserMigrationIsNotEnabled());
			throw new InternalServerErrorException('User Migration not enabled');
		}
	}

	public async matchUsers(importUsers: ImportUser[]): Promise<ImportUser[]> {
		const importUserMap: Map<string, number> = new Map();

		importUsers.forEach((importUser) => {
			const key = `${importUser.school.id}_${importUser.firstName}_${importUser.lastName}`;
			const count = importUserMap.get(key) || 0;
			importUserMap.set(key, count + 1);
		});

		const matchedImportUsers: ImportUser[] = await Promise.all(
			importUsers.map(async (importUser: ImportUser): Promise<ImportUser> => {
				const user: User[] = await this.userService.findUserBySchoolAndName(
					importUser.school.id,
					importUser.firstName,
					importUser.lastName
				);

				const key = `${importUser.school.id}_${importUser.firstName}_${importUser.lastName}`;

				if (user.length === 1 && importUserMap.get(key) === 1) {
					importUser.user = user[0];
					importUser.matchedBy = MatchCreator.AUTO;
				}

				return importUser;
			})
		);

		return matchedImportUsers;
	}

	public async deleteImportUsersBySchool(school: SchoolEntity) {
		await this.userImportRepo.deleteImportUsersBySchool(school);
	}
}
