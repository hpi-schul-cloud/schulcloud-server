import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BadRequestException, Injectable } from '@nestjs/common';
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

	constructor(private readonly systemService: SystemService) {
		this.hostUrl = Configuration.get('HOST') as string;
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
