import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system/service';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from './dto/page-content.dto';

@Injectable()
export class UserMigrationService {
	private readonly clientUrl: string;

	private readonly apiUrl: string;

	private readonly dashboardUrl: string = '/dashboard';

	private readonly logoutUrl: string = '/logout';

	private readonly loginUrl: string = '/login';

	constructor(private readonly schoolService: SchoolService, private readonly systemService: SystemService) {
		this.clientUrl = Configuration.get('HOST') as string;
		this.apiUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
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

		const url = new URL('/migration', this.clientUrl);
		url.searchParams.append('sourceSystem', iservSystem.id);
		url.searchParams.append('targetSystem', sanisSystem.id);
		url.searchParams.append('origin', originSystemId);
		url.searchParams.append('mandatory', (!!school?.oauthMigrationMandatory).toString());
		return url.toString();
	}

	async getPageContent(pageType: PageTypes, sourceId: string, targetId: string): Promise<PageContentDto> {
		const sourceSystem: SystemDto = await this.systemService.findById(sourceId);
		const targetSystem: SystemDto = await this.systemService.findById(targetId);

		const targetSystemLoginUrl: string = this.getLoginUrl(targetSystem);

		switch (pageType) {
			case PageTypes.START_FROM_TARGET_SYSTEM: {
				const sourceSystemLoginUrl: string = this.getLoginUrl(sourceSystem, targetSystemLoginUrl.toString());

				const content: PageContentDto = new PageContentDto({
					proceedButtonUrl: sourceSystemLoginUrl.toString(),
					cancelButtonUrl: this.loginUrl,
				});
				return content;
			}
			case PageTypes.START_FROM_SOURCE_SYSTEM: {
				const content: PageContentDto = new PageContentDto({
					proceedButtonUrl: targetSystemLoginUrl.toString(),
					cancelButtonUrl: this.dashboardUrl,
				});
				return content;
			}
			case PageTypes.START_FROM_SOURCE_SYSTEM_MANDATORY: {
				const content: PageContentDto = new PageContentDto({
					proceedButtonUrl: targetSystemLoginUrl.toString(),
					cancelButtonUrl: this.logoutUrl,
				});
				return content;
			}
			default: {
				throw new BadRequestException('Unknown PageType requested');
			}
		}
	}

	private getLoginUrl(system: SystemDto, postLoginRedirect?: string): string {
		if (!system.oauthConfig || !system.id) {
			throw new UnprocessableEntityException(`System ${system?.id || 'unknown'} has no oauth config`);
		}

		const loginUrl: URL = new URL(`/v3/sso/login/${system.id}`, this.apiUrl);
		if (postLoginRedirect) {
			loginUrl.searchParams.append('postLoginRedirect', postLoginRedirect);
		}

		return loginUrl.toString();
	}
}
