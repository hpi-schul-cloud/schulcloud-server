import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SchoolService } from '@src/modules/school';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserService } from '@src/modules/user';
import { UserDO } from '@shared/domain/domainobject/user.do';

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

	async shouldSchoolMigrate(currentUserId: string, externalId: string, schoolNumber: string | undefined) {
		if (!schoolNumber) {
			// TODO: create own like OauthError and throw new OauthMigrationError with code ext_official_school_number_missing
			return Promise.resolve();
		}

		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(schoolNumber);
		if (!existingSchool) {
			// TODO: create own like OauthError and throw new OauthMigrationError with code ext_official_school_number_mismatch
			return Promise.resolve();
		}

		const isExternalUserInSchool = await this.isExternalUserInSchool(currentUserId, existingSchool); // isCurrentUserInExternalSchool? why though? - just to validate the school number?
		if (!isExternalUserInSchool) {
			// TODO: create own like OauthError and throw new OauthMigrationError with code ext_official_school_number_mismatch
			return Promise.resolve();
		}

		if (externalId === existingSchool.externalId) {
			return false;
		} else {
			return true;
		}
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

	private async rollbackMigration(schoolDO: SchoolDO) {
		if (schoolDO) {
			await this.schoolService.save(schoolDO);
		}
	}
}
