import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { LegacyLogger } from '@src/core/logger';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { OAuthMigrationError } from '../error/oauth-migration.error';

@Injectable()
export class SchoolMigrationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly logger: LegacyLogger,
		private readonly userService: UserService
	) {}

	validateGracePeriod(school: SchoolDO) {
		if (!school.oauthMigrationFinalFinish || Date.now() >= school.oauthMigrationFinalFinish.getTime()) {
			throw new ValidationError('grace_period_expired: The grace period after finishing migration has expired', {
				'school.oauthMigrationFinalFinish': school.oauthMigrationFinalFinish,
			});
		}
	}

	async migrateSchool(externalId: string, existingSchool: SchoolDO, targetSystemId: string): Promise<void> {
		const schoolDOCopy: SchoolDO = new SchoolDO({ ...existingSchool });

		try {
			await this.doMigration(externalId, existingSchool, targetSystemId);
		} catch (e: unknown) {
			await this.rollbackMigration(schoolDOCopy);
			this.logger.log({
				message: `This error occurred during migration of School with official school number`,
				officialSchoolNumber: existingSchool.officialSchoolNumber,
				error: e,
			});
		}
	}

	async schoolToMigrate(
		currentUserId: string,
		externalId: string,
		schoolNumber: string | undefined
	): Promise<SchoolDO | null> {
		if (!schoolNumber) {
			throw new OAuthMigrationError(
				'Official school number from target migration system is missing',
				'ext_official_school_number_missing'
			);
		}

		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(schoolNumber);
		if (!existingSchool) {
			throw new OAuthMigrationError(
				'Could not find school by official school number from target migration system',
				'ext_official_school_number_mismatch'
			);
		}

		const isExternalUserInSchool: boolean = await this.isExternalUserInSchool(currentUserId, existingSchool);
		if (!isExternalUserInSchool) {
			throw new OAuthMigrationError(
				'Current users school is not the same as school found by official school number from target migration system',
				'ext_official_school_number_mismatch'
			);
		}

		if (externalId === existingSchool.externalId) {
			return null;
		}
		return existingSchool;
	}

	async completeMigration(schoolId: string, migrationStartedAt: Date | undefined): Promise<void> {
		const startTime: number = performance.now();
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const notMigratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId,
			isOutdated: false,
			lastLoginSystemChangeSmallerThan: migrationStartedAt,
		});

		notMigratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = school.oauthMigrationFinished;
		});
		await this.userService.saveAll(notMigratedUsers.data);
		const endTime: number = performance.now();
		this.logger.warn(`completeMigration for schoolId ${schoolId} took ${endTime - startTime} milliseconds`);
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
}
