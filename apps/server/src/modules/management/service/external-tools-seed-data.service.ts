import { OauthProviderService } from '@modules/oauth-provider/domain';
import { ExternalTool, ExternalToolService, Oauth2ToolConfig } from '@modules/tool';
import { TokenEndpointAuthMethod } from '@modules/tool/common/enum';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalToolsSeedDataService {
	constructor(
		private readonly configService: ConfigService,
		private readonly externalToolService: ExternalToolService,
		private readonly oauthProviderService: OauthProviderService
	) {}

	public async import(): Promise<number> {
		const externalTools: ExternalTool[] = [];

		const nextcloudName: string | undefined = this.configService.get<string>(
			'NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME'
		);
		const nextcloudBaseUrl: string | undefined = this.configService.get<string>('NEXTCLOUD_BASE_URL');
		const nextcloudClientId: string | undefined = this.configService.get<string>('NEXTCLOUD_CLIENT_ID');
		const nextcloudClientSecret: string | undefined = this.configService.get<string>('NEXTCLOUD_CLIENT_SECRET');
		const nextcloudScopes: string | undefined = this.configService.get<string>('NEXTCLOUD_SCOPES');

		if (nextcloudBaseUrl && nextcloudClientId && nextcloudClientSecret) {
			externalTools.push(
				new ExternalTool({
					id: '65f958bdd8b35469f14032b1',
					name: nextcloudName || 'SchulcloudNextcloud',
					config: new Oauth2ToolConfig({
						baseUrl: nextcloudBaseUrl,
						clientId: nextcloudClientId,
						clientSecret: nextcloudClientSecret,
						skipConsent: true,
						scope: nextcloudScopes || 'openid offline profile email groups',
						redirectUris: [`${nextcloudBaseUrl}/apps/user_oidc/code`],
						frontchannelLogoutUri: `${nextcloudBaseUrl}/apps/schulcloud/logout`,
						tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
					}),
					openNewTab: true,
					isHidden: true,
					isDeactivated: false,
					isPreferred: false,
				})
			);
		}

		if (externalTools.length > 0) {
			await Promise.all(
				externalTools.map(async (externalTool: ExternalTool): Promise<void> => {
					if (ExternalTool.isOauth2Config(externalTool.config)) {
						try {
							await this.oauthProviderService.deleteOAuth2Client(externalTool.config.clientId);
						} catch (e) {
							// Ignore error if client does not exist
						}
					}

					await this.externalToolService.createExternalTool(externalTool);
				})
			);
		}

		return externalTools.length;
	}
}
