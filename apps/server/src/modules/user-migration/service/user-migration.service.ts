import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class UserMigrationService {
	private readonly HOST: string;

	constructor(private readonly schoolService: SchoolService, private readonly systemService: SystemService) {
		this.HOST = Configuration.get('HOST') as string;
	}

	async isSchoolInMigration(officialSchoolNumber: string): Promise<boolean> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);
		const isInMigration: boolean = !!school?.oauthMigrationPossible || !!school?.oauthMigrationMandatory;
		return isInMigration;
	}

	async getMigrationRedirect(officialSchoolNumber: string, originSystemId: string): Promise<string> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);
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

		const url = new URL('/migration', this.HOST);
		url.searchParams.append('sourceSystem', iservSystem.id);
		url.searchParams.append('targetSystem', sanisSystem.id);
		url.searchParams.append('origin', originSystemId);
		url.searchParams.append('mandatory', (!!school?.oauthMigrationMandatory).toString());
		return url.toString();
	}
}
