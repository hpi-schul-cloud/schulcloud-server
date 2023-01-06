import { Injectable } from '@nestjs/common';
import { SchoolService } from '@src/modules/school';
import { MigrationResponse } from '@src/modules/school/controller/dto';

@Injectable()
export class UserMigrationService {
	constructor(private readonly schoolService: SchoolService) {}

	async isSchoolInMigration(officialSchoolNumber: string): Promise<boolean> {
		const migration: MigrationResponse = await this.schoolService.getMigration(externalSchoolId);

		return migration.oauthMigrationPossible || migration.oauthMigrationMandatory;
	}
}
