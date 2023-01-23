import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { EntityNotFoundError } from '@shared/common';
import { SystemDto, SystemService } from '@src/modules/system/service';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from './dto/page-content.dto';

@Injectable()
export class UserMigrationService {
	private readonly hostUrl: string;

	private readonly dashboardUrl: string = '/dashboard';

	private readonly logoutUrl: string = '/logout';

	private readonly loginUrl: string = '/login';

	constructor(private readonly schoolService: SchoolService, private readonly systemService: SystemService) {
		this.hostUrl = Configuration.get('HOST') as string;
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

		const url = new URL('/migration', this.hostUrl);
		url.searchParams.append('sourceSystem', iservSystem.id);
		url.searchParams.append('targetSystem', sanisSystem.id);
		url.searchParams.append('origin', originSystemId);
		url.searchParams.append('mandatory', (!!school?.oauthMigrationMandatory).toString());
		return url.toString();
	}

	async getPageContent(pageType: PageTypes, sourceId: string, targetId: string): Promise<PageContentDto> {
		const sourceSystem: SystemDto = await this.systemService.findById(sourceId);
		const targetSystem: SystemDto = await this.systemService.findById(targetId);

		const targetSystemLoginUrl: URL = this.getOauthLoginUrl(targetSystem);
		targetSystemLoginUrl.searchParams.set('redirect_uri', this.getMigrationRedirectUri(targetId));

		switch (pageType) {
			case PageTypes.START_FROM_TARGET_SYSTEM: {
				const sourceSystemLoginUrl: URL = this.getOauthLoginUrl(sourceSystem, targetSystemLoginUrl.toString());

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

	private getOauthLoginUrl(system: SystemDto, postLoginUri?: string): URL {
		if (!system.oauthConfig) {
			throw new EntityNotFoundError(`System ${system?.id || 'unknown'} has no oauth config`);
		}

		const { oauthConfig } = system;

		const loginUrl: URL = new URL(oauthConfig.authEndpoint);
		loginUrl.searchParams.append('client_id', oauthConfig.clientId);
		loginUrl.searchParams.append('redirect_uri', this.getRedirectUri(oauthConfig.redirectUri, postLoginUri).toString());
		loginUrl.searchParams.append('response_type', oauthConfig.responseType);
		loginUrl.searchParams.append('scope', oauthConfig.scope);

		return loginUrl;
	}

	private getRedirectUri(redirectUri: string, postLoginUri?: string): URL {
		const combinedUri = new URL(redirectUri);
		if (postLoginUri) {
			combinedUri.searchParams.append('postLoginRedirect', postLoginUri);
		}

		return combinedUri;
	}

	private getMigrationRedirectUri(systemId: string): string {
		const combinedUri = new URL(this.hostUrl);
		combinedUri.pathname = `/api/v3/sso/oauth/${systemId}/migration`;
		return combinedUri.toString();
	}
}
