import { SystemRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthConfig, System } from '@shared/domain';
import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { PageTypes } from '../controller/dto/page-type.query.param';
import { PageContentDto } from './dto/page-content.dto';

export class MigrationService {
	private readonly PROCESS_MIGRATION_BASE_URL: string = `${
		Configuration.get('HOST') as string
	}/api/v3/migration/process`;

	constructor(private readonly systemRepo: SystemRepo) {}

	async getPageContent(pageType: PageTypes, sourceId: string, targetId: string): Promise<PageContentDto> {
		const content: PageContentDto = new PageContentDto();
		const sourceSystem: System = await this.systemRepo.findById(sourceId);
		const targetSystem: System = await this.systemRepo.findById(targetId);

		content.proceedButtonUrl = this.getLoginUrl(targetSystem, `${this.PROCESS_MIGRATION_BASE_URL}`);

		switch (pageType) {
			case PageTypes.START_FROM_NEW_SYSTEM:
				content.proceedButtonUrl = this.getLoginUrl(
					sourceSystem,
					this.getLoginUrl(targetSystem, `${this.PROCESS_MIGRATION_BASE_URL}`)
				);
				content.cancelButtonUrl = this.getLogoutUrl();
				break;
			case PageTypes.START_FROM_OLD_SYSTEM:
				content.cancelButtonUrl = this.getDashboardUrl();
				break;
			case PageTypes.START_FROM_OLD_SYSTEM_MANDATORY:
				content.cancelButtonUrl = this.getLogoutUrl();
				break;
			default:
				throw new BadRequestException('Unknown PageType requested');
		}

		return content;
	}

	private getLoginUrl(system: System, postLoginUri?: string): string {
		if (!system.oauthConfig) throw new EntityNotFoundError(OauthConfig.name);

		const { oauthConfig } = system;

		const encodedURI = [
			oauthConfig.authEndpoint,
			'?client_id=',
			oauthConfig.clientId,
			'&redirect_uri=',
			this.createPostLoginUri(oauthConfig.redirectUri, postLoginUri),
			'&response_type=',
			oauthConfig.responseType,
			'&scope=',
			oauthConfig.scope,
		].join('');

		return encodedURI;
	}

	private createPostLoginUri(redirectUri: string, postLoginUri?: string): string {
		if (!postLoginUri) return redirectUri;
		const combinedUri = [redirectUri, 'postLoginRedirect=', postLoginUri].join(redirectUri.includes('?') ? '&' : '?');

		return combinedUri;
	}

	private getDashboardUrl(): string {
		const dashboardUrl = `${Configuration.get('HOST') as string}/dashboard`;

		return dashboardUrl;
	}

	private getLogoutUrl(): string {
		const logoutUrl = `${Configuration.get('HOST') as string}/logout`;

		return logoutUrl;
	}
}
