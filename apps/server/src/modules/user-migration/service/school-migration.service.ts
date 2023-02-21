import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SchoolService } from '@src/modules/school';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserService } from '@src/modules/user';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { MigrationError } from '../error/migration.error';
import { MigrationErrorCodeEnum } from '../error/migration-error-code.enum';

// TODO: test
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
		schoolNumber: string,
		targetSystemId: string
	): Promise<void> {
		const existingSchool: SchoolDO = (await this.schoolService.getSchoolBySchoolNumber(schoolNumber)) as SchoolDO;
		const schoolDOCopy: SchoolDO = new SchoolDO({ ...existingSchool });

		try {
			await this.doMigration(externalId, existingSchool, targetSystemId);
		} catch (e) {
			await this.rollbackMigration(schoolDOCopy);
			this.logger.log(
				`This error occurred during migration of School with official school number: ${
					existingSchool.officialSchoolNumber || ''
				} `
			);
			this.logger.log(e);
		}
		return Promise.resolve();
	}

	async shouldSchoolMigrate(
		currentUserId: string,
		externalId: string,
		schoolNumber: string | undefined
	): Promise<boolean> {
		if (!schoolNumber) {
			throw new MigrationError(MigrationErrorCodeEnum.OFFICIAL_SCHOOL_NUMBER_MISSING);
		}

		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(schoolNumber);
		if (!existingSchool) {
			throw new MigrationError(MigrationErrorCodeEnum.OFFICIAL_SCHOOL_NUMBER_MISMATCH);
		}

		const isExternalUserInSchool = await this.isCurrentUserInExternalSchool(currentUserId, existingSchool);
		if (!isExternalUserInSchool) {
			throw new MigrationError();
		}

		if (externalId === existingSchool.externalId) {
			return false;
		}
		return true;
	}

	private async isCurrentUserInExternalSchool(
		currentUserId: string,
		existingSchool: SchoolDO | null
	): Promise<boolean> {
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

	private async rollbackMigration(schoolDO: SchoolDO | null) {
		if (schoolDO) {
			await this.schoolService.save(schoolDO);
		}
	}
}
