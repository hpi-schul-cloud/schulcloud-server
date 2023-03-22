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
		officialSchoolNumber: string | undefined,
		targetSystemId: string
	): Promise<SchoolDO | null> {
		const userDO: UserDO = await this.userService.findById(currentUserId);
		const schoolDO: SchoolDO = await this.schoolService.getSchoolById(userDO.schoolId);
		const sourceSystem: string = schoolDO.systems ? schoolDO.systems[0] : '';

		if (!officialSchoolNumber) {
			throw new OAuthMigrationError(
				'Official school number from target migration system is missing',
				'ext_official_school_number_missing'
			);
		}

		this.checkOfficialSchoolNumbersMatch(schoolDO, officialSchoolNumber, sourceSystem, targetSystemId);

		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (!existingSchool) {
			throw new OAuthMigrationError(
				'Could not find school by official school number from target migration system',
				'ext_official_school_missing',
				schoolDO.systems ? schoolDO.systems[0] : '',
				targetSystemId
			);
		}

		const schoolMigrated: boolean = this.hasSchoolMigrated(externalId, existingSchool.externalId);

		if (schoolMigrated) {
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

	private checkOfficialSchoolNumbersMatch(
		schoolDO: SchoolDO,
		officialExternalSchoolNumber: string,
		sourceSystem: string,
		targetSystem: string
	): void {
		if (schoolDO.officialSchoolNumber !== officialExternalSchoolNumber) {
			throw new OAuthMigrationError(
				'Current users school is not the same as school found by official school number from target migration system',
				'ext_official_school_number_mismatch',
				sourceSystem,
				targetSystem,
				schoolDO.officialSchoolNumber,
				officialExternalSchoolNumber
			);
		}
	}

	private hasSchoolMigrated(sourceExternalId: string, targetExternalId?: string): boolean {
		if (sourceExternalId === targetExternalId) {
			return true;
		}
		return false;
	}
}
