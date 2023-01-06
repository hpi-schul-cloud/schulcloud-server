import { SystemRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthConfig, System } from '@shared/domain';
import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { PageTypes } from '../controller/dto/page-type.query.param';
import { PageContentDto } from './dto/page-content.dto';
import { CancelKeys, ContentKeys } from '../interface/keys.enum';

export class MigrationService {
	private readonly CHECK_MIGRATION_BASE_URL: string = `${Configuration.get('HOST') as string}/api/v3/migration/check`;

	private readonly PROCESS_MIGRATION_BASE_URL: string = `${
		Configuration.get('HOST') as string
	}/api/v3/migration/process`;

	constructor(private readonly systemRepo: SystemRepo) {}

	async getPageContent(pageType: PageTypes, sourceId: string, targetId: string): Promise<PageContentDto> {
		const content: PageContentDto = new PageContentDto();
		const sourceSystem: System = await this.systemRepo.findById(sourceId);
		const targetSystem: System = await this.systemRepo.findById(targetId);

		switch (pageType) {
			case PageTypes.START_FROM_NEW_SYSTEM:
				content.contentKey = ContentKeys.START_FROM_NEW_SYSTEM;
				content.proceedButtonUrl = this.getLoginUrl(
					sourceSystem,
					`${this.CHECK_MIGRATION_BASE_URL}/${sourceSystem.id}?skip=true`
				);
				content.cancelButtonKey = CancelKeys.BUTTON_LOGOUT;
				content.cancelButtonUrl = this.getLogoutUrl();
				break;
			case PageTypes.START_FROM_OLD_SYSTEM:
				content.contentKey = ContentKeys.START_FROM_OLD_SYSTEM;
				content.proceedButtonUrl = this.getLoginUrl(
					targetSystem,
					`${this.PROCESS_MIGRATION_BASE_URL}/${sourceSystem.id}`
				);
				content.cancelButtonKey = CancelKeys.BUTTON_NOTNOW;
				content.cancelButtonUrl = this.getDashboardUrl();
				break;
			case PageTypes.START_FROM_OLD_SYSTEM_MANDATORY:
				content.contentKey = ContentKeys.START_FROM_OLD_SYSTEM_MANDATORY;
				content.proceedButtonUrl = this.getLoginUrl(
					targetSystem,
					`${this.PROCESS_MIGRATION_BASE_URL}/${sourceSystem.id}`
				);
				content.cancelButtonKey = CancelKeys.BUTTON_LOGOUT;
				content.cancelButtonUrl = this.getLogoutUrl();
				break;
			default:
				throw new BadRequestException('Unknown PageType requested');
		}

		return content;
	}

	private getLoginUrl(system: System, redirectUri?: string): string {
		if (!system.oauthConfig) throw new EntityNotFoundError(OauthConfig.name);

		const { oauthConfig } = system;

		const encodedURI = [
			oauthConfig.authEndpoint,
			'?client_id=',
			oauthConfig.clientId,
			'&redirect_uri=',
			redirectUri ?? oauthConfig.redirectUri,
			'&response_type=',
			oauthConfig.responseType,
			'&scope=',
			oauthConfig.scope,
		].join('');

		return encodedURI;
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
