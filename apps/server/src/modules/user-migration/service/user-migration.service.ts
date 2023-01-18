import { OauthConfig } from '@shared/domain';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { SystemService, SystemDto } from '@src/modules/system/service';
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

		const encodedURI = new URL(oauthConfig.authEndpoint);
		encodedURI.searchParams.append('client_id', oauthConfig.clientId);
		encodedURI.searchParams.append('redirect_uri', this.createPostLoginUri(oauthConfig.redirectUri, postLoginUri));
		encodedURI.searchParams.append('response_type', oauthConfig.responseType);
		encodedURI.searchParams.append('scope', oauthConfig.scope);

		return encodedURI.toString();
	}

	private createPostLoginUri(redirectUri: string, postLoginUri: string): string {
		const combinedUri = new URL(redirectUri);
		combinedUri.searchParams.append('postLoginRedirect', postLoginUri);

		return combinedUri.toString();
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
