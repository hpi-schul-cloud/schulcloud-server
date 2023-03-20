import { Injectable } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Page } from '@shared/domain/domainobject/page';
import { Logger } from '@src/core/logger';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { OAuthMigrationError } from '../error/oauth-migration.error';

@Injectable()
export class SchoolMigrationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly logger: Logger,
		private readonly userService: UserService
	) {}

	async migrateSchool(
		currentUserId: string,
		externalId: string,
		officialExternalSchoolNumber: string | undefined,
		targetSystemId: string
	): Promise<void> {
		const schoolToMigrate: SchoolDO | null = await this.schoolToMigrate(
			currentUserId,
			externalId,
			officialExternalSchoolNumber
		);

		if (schoolToMigrate) {
			const schoolDOCopy: SchoolDO = new SchoolDO({ ...schoolToMigrate });

			try {
				await this.doMigration(externalId, schoolToMigrate, targetSystemId);
			} catch (e: unknown) {
				await this.rollbackMigration(schoolDOCopy);
				this.logger.log({
					message: `This error occurred during migration of School with official school number`,
					officialSchoolNumber: schoolToMigrate.officialSchoolNumber,
					error: e,
				});
			}
		}
	}

	async schoolToMigrate(
		currentUserId: string,
		externalId: string,
		officialExternalSchoolNumber: string | undefined
	): Promise<SchoolDO | null> {
		if (!officialExternalSchoolNumber) {
			throw new OAuthMigrationError(
				'Official school number from target migration system is missing',
				'ext_official_school_number_missing'
			);
		}

		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(
			officialExternalSchoolNumber
		);

		if (!existingSchool) {
			throw new OAuthMigrationError(
				'Could not find school by official school number from target migration system',
				'ext_official_school_missing'
			);
		}

		await this.checkOfficialSchoolNumbersMatch(currentUserId, officialExternalSchoolNumber);

		if (externalId === existingSchool.externalId) {
			return null;
		}
		return existingSchool;
	}

	async completeMigration(schoolId: string): Promise<void> {
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const notMigratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId,
			isOutdated: false,
			lastLoginSystemChangeSmallerThan: school.oauthMigrationPossible,
		});

		notMigratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = school.oauthMigrationFinished;
		});
		await this.userService.saveAll(notMigratedUsers.data);
	}

	async restartMigration(schoolId: string): Promise<void> {
		const startTime: number = performance.now();
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const migratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId,
			outdatedSince: school.oauthMigrationFinished,
		});

		migratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = undefined;
		});
		await this.userService.saveAll(migratedUsers.data);

		school.oauthMigrationMandatory = undefined;

		const endTime: number = performance.now();
		this.logger.warn(`restartMigration for schoolId ${schoolId} took ${endTime - startTime} milliseconds`);
	}

	private async isExternalUserInSchool(currentUserId: string, existingSchool: SchoolDO | null): Promise<boolean> {
		const currentUser: UserDO = await this.userService.findById(currentUserId);

		if (!existingSchool || existingSchool?.id !== currentUser.schoolId) {
			return false;
		}
		return true;
	}

	private async doMigration(externalId: string, schoolDO: SchoolDO, targetSystemId: string): Promise<void> {
		if (schoolDO.systems) {
			schoolDO.systems.push(targetSystemId);
		} else {
			schoolDO.systems = [targetSystemId];
		}
		schoolDO.previousExternalId = schoolDO.externalId;
		schoolDO.externalId = externalId;
		await this.schoolService.save(schoolDO);
	}

	private async rollbackMigration(originalSchoolDO: SchoolDO) {
		if (originalSchoolDO) {
			await this.schoolService.save(originalSchoolDO);
		}
	}

	private async checkOfficialSchoolNumbersMatch(userId: string, officialExternalSchoolNumber: string): Promise<void> {
		const userDO: UserDO = await this.userService.findById(userId);
		const schoolDO: SchoolDO = await this.schoolService.getSchoolById(userDO.schoolId);

		if (schoolDO.officialSchoolNumber !== officialExternalSchoolNumber) {
			throw new OAuthMigrationError(
				'Current users school is not the same as school found by official school number from target migration system',
				'ext_official_school_number_mismatch',
				schoolDO.officialSchoolNumber,
				officialExternalSchoolNumber
			);
		}
	}
}
