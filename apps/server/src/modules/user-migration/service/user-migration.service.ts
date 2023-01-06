import { Injectable } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';

@Injectable()
export class UserMigrationService {
	constructor(private readonly schoolService: SchoolService) {}

	async isSchoolInMigration(officialSchoolNumber: string): Promise<boolean> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);
		const isInMigration: boolean = !!school && (!!school.oauthMigrationPossible || !!school.oauthMigrationMandatory);
		return isInMigration;
	}

	async getMigrationRedirect(officialSchoolNumber: string): Promise<string> {
		return '/migration?source=sanistarget=iserv';
	}
}
