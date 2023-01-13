import { OauthConfig } from '@shared/domain';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { SystemService } from '@src/modules/system/service/';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { PageContentDto } from './dto/page-content.dto';
import { PageTypes } from '../interface/page-types.enum';

@Injectable()
export class UserMigrationService {
	private readonly PROCESS_MIGRATION_BASE_URL: string = '/api/v3/oauth/migration';

	constructor(private readonly systemService: SystemService) {}

	async getPageContent(pageType: PageTypes, sourceId: string, targetId: string): Promise<PageContentDto> {
		const content: PageContentDto = new PageContentDto({ proceedButtonUrl: '', cancelButtonUrl: '' });
		const sourceSystem: SystemDto = await this.systemService.findById(sourceId);
		const targetSystem: SystemDto = await this.systemService.findById(targetId);

		content.proceedButtonUrl = this.getOauthLoginUrl(targetSystem, `${this.PROCESS_MIGRATION_BASE_URL}`);

		switch (pageType) {
			case PageTypes.START_FROM_TARGET_SYSTEM:
				content.proceedButtonUrl = this.getOauthLoginUrl(
					sourceSystem,
					this.getOauthLoginUrl(targetSystem, `${this.PROCESS_MIGRATION_BASE_URL}`)
				);
				content.cancelButtonUrl = this.getLoginUrl();
				break;
			case PageTypes.START_FROM_SOURCE_SYSTEM:
				content.cancelButtonUrl = this.getDashboardUrl();
				break;
			case PageTypes.START_FROM_SOURCE_SYSTEM_MANDATORY:
				content.cancelButtonUrl = this.getLogoutUrl();
				break;
			default:
				throw new BadRequestException('Unknown PageType requested');
		}

		return content;
	}

	private getOauthLoginUrl(system: SystemDto, postLoginUri: string): string {
		if (!system.oauthConfig) {
			throw new EntityNotFoundError(OauthConfig.name);
		}

		const { oauthConfig } = system;

		const encodedURI = encodeURI(
			[
				oauthConfig.authEndpoint,
				'?client_id=',
				oauthConfig.clientId,
				'&redirect_uri=',
				this.createPostLoginUri(oauthConfig.redirectUri, postLoginUri),
				'&response_type=',
				oauthConfig.responseType,
				'&scope=',
				oauthConfig.scope,
			].join('')
		);
		return encodedURI;
	}

	private createPostLoginUri(redirectUri: string, postLoginUri: string): string {
		const combinedUri = encodeURI(
			[redirectUri, 'postLoginRedirect=', postLoginUri].join(redirectUri.includes('?') ? '&' : '?')
		);

		return combinedUri;
	}

	private getDashboardUrl(): string {
		const dashboardUrl = '/dashboard';

		return dashboardUrl;
	}

	private getLogoutUrl(): string {
		const logoutUrl = '/logout';

		return logoutUrl;
	}

	private getLoginUrl(): string {
		const loginUrl = '/login';

		return loginUrl;
	}
}
