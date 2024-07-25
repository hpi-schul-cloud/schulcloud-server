import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo, Page, UserDO, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { UserLoginMigrationRepo } from '@shared/repo';
import { LegacyLogger, Logger } from '@src/core/logger';
import { performance } from 'perf_hooks';
import {
	SchoolMigrationDatabaseOperationFailedLoggableException,
	SchoolNumberMismatchLoggableException,
} from '../loggable';

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
		const schoolDOCopy: LegacySchoolDo = new LegacySchoolDo({ ...existingSchool });

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
		const user: UserDO = await this.userService.findById(userId);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(user.schoolId);

		this.checkOfficialSchoolNumbersMatch(school, officialSchoolNumber);

		const schoolMigrated: boolean = this.hasSchoolMigrated(school.externalId, externalId);

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
		const isExternalIdEquivalent: boolean = sourceExternalId === targetExternalId;

		return isExternalIdEquivalent;
	}

	public async markUnmigratedUsersAsOutdated(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		const startTime: number = performance.now();

		const notMigratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId: userLoginMigration.schoolId,
			isOutdated: false,
			lastLoginSystemChangeSmallerThan: userLoginMigration.startedAt,
		});

		notMigratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = userLoginMigration.closedAt;
		});

		await this.userService.saveAll(notMigratedUsers.data);

		const endTime: number = performance.now();
		this.legacyLogger.warn(
			`markUnmigratedUsersAsOutdated for schoolId ${userLoginMigration.schoolId} took ${
				endTime - startTime
			} milliseconds`
		);
	}

	public async unmarkOutdatedUsers(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		const startTime: number = performance.now();

		const migratedUsers: Page<UserDO> = await this.userService.findUsers({
			schoolId: userLoginMigration.schoolId,
			outdatedSince: userLoginMigration.finishedAt,
		});

		migratedUsers.data.forEach((user: UserDO) => {
			user.outdatedSince = undefined;
		});

		await this.userService.saveAll(migratedUsers.data);

		const endTime: number = performance.now();
		this.legacyLogger.warn(
			`unmarkOutdatedUsers for schoolId ${userLoginMigration.schoolId} took ${endTime - startTime} milliseconds`
		);
	}

	public async hasSchoolMigratedUser(schoolId: string): Promise<boolean> {
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
