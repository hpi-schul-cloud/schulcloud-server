import { LegacyLogger, Logger } from '@core/logger';
import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { UserService } from '@modules/user';
import { UserDo } from '@modules/user/domain';
import { Injectable } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { UserLoginMigrationDO } from '../domain';
import {
	SchoolMigrationDatabaseOperationFailedLoggableException,
	SchoolNumberMismatchLoggableException,
} from '../loggable';
import { UserLoginMigrationRepo } from '../repo';

@Injectable()
export class SchoolMigrationService {
	constructor(
		private readonly schoolService: LegacySchoolService,
		private readonly legacyLogger: LegacyLogger,
		private readonly logger: Logger,
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo
	) {}

	public async migrateSchool(
		existingSchool: LegacySchoolDo,
		externalId: string,
		targetSystemId: string
	): Promise<void> {
		const schoolDOCopy = new LegacySchoolDo({ ...existingSchool });

		try {
			await this.doMigration(externalId, existingSchool, targetSystemId);
		} catch (error: unknown) {
			await this.tryRollbackMigration(schoolDOCopy);

			throw new SchoolMigrationDatabaseOperationFailedLoggableException(existingSchool, 'migration', error);
		}
	}

	private async doMigration(externalId: string, school: LegacySchoolDo, targetSystemId: string): Promise<void> {
		school.previousExternalId = school.externalId;
		school.externalId = externalId;
		if (!school.systems) {
			school.systems = [];
		}
		if (!school.systems.includes(targetSystemId)) {
			school.systems.push(targetSystemId);
		}

		await this.schoolService.save(school);
	}

	private async tryRollbackMigration(originalSchoolDO: LegacySchoolDo): Promise<void> {
		try {
			await this.schoolService.save(originalSchoolDO);
		} catch (error: unknown) {
			this.logger.warning(
				new SchoolMigrationDatabaseOperationFailedLoggableException(originalSchoolDO, 'rollback', error)
			);
		}
	}

	public async getSchoolForMigration(
		userId: string,
		externalId: string,
		officialSchoolNumber: string
	): Promise<LegacySchoolDo | null> {
		const user = await this.userService.findById(userId);
		const school = await this.schoolService.getSchoolById(user.schoolId);

		this.checkOfficialSchoolNumbersMatch(school, officialSchoolNumber);

		const schoolMigrated = this.hasSchoolMigrated(school.externalId, externalId);

		if (schoolMigrated) {
			return null;
		}

		return school;
	}

	private checkOfficialSchoolNumbersMatch(schoolDO: LegacySchoolDo, officialExternalSchoolNumber: string): void {
		if (schoolDO.officialSchoolNumber !== officialExternalSchoolNumber) {
			throw new SchoolNumberMismatchLoggableException(
				schoolDO.officialSchoolNumber ?? '',
				officialExternalSchoolNumber
			);
		}
	}

	public hasSchoolMigrated(sourceExternalId: string | undefined, targetExternalId: string): boolean {
		const isExternalIdEquivalent = sourceExternalId === targetExternalId;

		return isExternalIdEquivalent;
	}

	public hasSchoolMigratedInMigrationPhase(
		schoolDO: LegacySchoolDo,
		userLoginMigrationDO: UserLoginMigrationDO
	): boolean {
		if (!schoolDO.systems) {
			return false;
		}

		const hasSchoolMigratedToTargetSystem = schoolDO.systems.includes(userLoginMigrationDO.targetSystemId);

		return hasSchoolMigratedToTargetSystem;
	}

	public async markUnmigratedUsersAsOutdated(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		const startTime = performance.now();

		const notMigratedUsers = await this.userService.findUsers({
			schoolId: userLoginMigration.schoolId,
			isOutdated: false,
			lastLoginSystemChangeSmallerThan: userLoginMigration.startedAt,
		});

		notMigratedUsers.data.forEach((user: UserDo) => {
			user.outdatedSince = userLoginMigration.closedAt;
		});

		await this.userService.saveAll(notMigratedUsers.data);

		const endTime = performance.now();
		this.legacyLogger.warn(
			`markUnmigratedUsersAsOutdated for schoolId ${userLoginMigration.schoolId} took ${
				endTime - startTime
			} milliseconds`
		);
	}

	public async unmarkOutdatedUsers(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		const startTime = performance.now();

		const migratedUsers = await this.userService.findUsers({
			schoolId: userLoginMigration.schoolId,
			outdatedSince: userLoginMigration.closedAt,
		});

		migratedUsers.data.forEach((user: UserDo) => {
			user.outdatedSince = undefined;
		});

		await this.userService.saveAll(migratedUsers.data);

		const endTime = performance.now();
		this.legacyLogger.warn(
			`unmarkOutdatedUsers for schoolId ${userLoginMigration.schoolId} took ${endTime - startTime} milliseconds`
		);
	}

	public async hasSchoolMigratedUser(schoolId: string): Promise<boolean> {
		const userLoginMigration = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		if (!userLoginMigration) {
			return false;
		}

		const users = await this.userService.findUsers({
			lastLoginSystemChangeBetweenStart: userLoginMigration.startedAt,
			lastLoginSystemChangeBetweenEnd: userLoginMigration.closedAt,
		});

		if (users.total > 0) {
			return true;
		}

		return false;
	}
}
