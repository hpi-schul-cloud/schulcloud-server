import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '../../system';
import { SystemDto } from '../../system/service/dto/system.dto';

@Injectable()
export class UserMigrationService {
	constructor(private readonly schoolService: SchoolService, private readonly systemService: SystemService) {}

	async isSchoolInMigration(officialSchoolNumber: string): Promise<boolean> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);
		const isInMigration: boolean = !!school?.oauthMigrationPossible || !!school?.oauthMigrationMandatory;
		return isInMigration;
	}

	async getMigrationRedirect(): Promise<string> {
		const oauthSystems: SystemDto[] = await this.systemService.findOAuth();
		const sanisSystem: SystemDto | undefined = oauthSystems.find(
			(system: SystemDto): boolean => system.alias === 'SANIS'
		);
		const iservSystem: SystemDto | undefined = oauthSystems.find(
			(system: SystemDto): boolean => system.alias === 'Schulserver'
		);

		if (!iservSystem?.id || !sanisSystem?.id) {
			throw new InternalServerErrorException(
				'Unable to generate migration redirect url. Iserv or Sanis system information is invalid.'
			);
		}

		return `/migration?source=${iservSystem.id}&target=${sanisSystem.id}`;
	}
}
