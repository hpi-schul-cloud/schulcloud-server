import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { Page, SchoolDO, UserDO, UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { performance } from 'perf_hooks';
import { OAuthMigrationError } from '../error';

@Injectable()
export class SchoolMigrationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly logger: LegacyLogger,
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo
	) {}

	validateGracePeriod(userLoginMigration: UserLoginMigrationDO) {
		if (userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime()) {
			throw new ValidationError('grace_period_expired: The grace period after finishing migration has expired', {
				finishedAt: userLoginMigration.finishedAt,
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
		officialSchoolNumber: string | undefined
	): Promise<SchoolDO | null> {
		if (!officialSchoolNumber) {
			throw new OAuthMigrationError(
				'Official school number from target migration system is missing',
				'ext_official_school_number_missing'
			);
		}

		const userDO: UserDO | null = await this.userService.findById(currentUserId);
		if (userDO) {
			const schoolDO: SchoolDO = await this.schoolService.getSchoolById(userDO.schoolId);
			this.checkOfficialSchoolNumbersMatch(schoolDO, officialSchoolNumber);
		}

		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (!existingSchool) {
			throw new OAuthMigrationError(
				'Could not find school by official school number from target migration system',
				'ext_official_school_missing'
			);
		}

		const schoolMigrated: boolean = this.hasSchoolMigrated(externalId, existingSchool.externalId);

		if (schoolMigrated) {
			return null;
		}

		return existingSchool;
	}

	async markUnmigratedUsersAsOutdated(schoolId: string): Promise<void> {
		const startTime: number = performance.now();

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		if (!userLoginMigration) {
			throw new UnprocessableEntityException(`School ${schoolId} has no UserLoginMigration`);
		}

		const notMigratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId,
			isOutdated: false,
			lastLoginSystemChangeSmallerThan: userLoginMigration.startedAt,
		});

		notMigratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = userLoginMigration.closedAt;
		});

		await this.userService.saveAll(notMigratedUsers.data);

		const endTime: number = performance.now();
		this.logger.warn(`completeMigration for schoolId ${schoolId} took ${endTime - startTime} milliseconds`);
	}

	async unmarkOutdatedUsers(schoolId: string): Promise<void> {
		const startTime: number = performance.now();

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		if (!userLoginMigration) {
			throw new UnprocessableEntityException(`School ${schoolId} has no UserLoginMigration`);
		}

		const migratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId,
			outdatedSince: userLoginMigration.finishedAt,
		});

		migratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = undefined;
		});

		await this.userService.saveAll(migratedUsers.data);

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

	private checkOfficialSchoolNumbersMatch(schoolDO: SchoolDO, officialExternalSchoolNumber: string): void {
		if (schoolDO.officialSchoolNumber !== officialExternalSchoolNumber) {
			throw new OAuthMigrationError(
				'Current users school is not the same as school found by official school number from target migration system',
				'ext_official_school_number_mismatch',
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

	async hasSchoolMigratedUser(schoolId: string): Promise<boolean> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		if (!userLoginMigration) {
			return false;
		}

		const users: Page<UserDO> = await this.userService.findUsers({
			lastLoginSystemChangeBetweenStart: userLoginMigration.startedAt,
			lastLoginSystemChangeBetweenEnd: userLoginMigration.closedAt,
		});

		if (users.total > 0) {
			return true;
		}

		return false;
	}
}
