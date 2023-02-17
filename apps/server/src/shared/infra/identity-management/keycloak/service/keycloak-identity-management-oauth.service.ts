import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OauthConfigDto } from '@src/modules/system/service';
import qs from 'qs';
import { lastValueFrom } from 'rxjs';
import { IdentityManagementOauthService } from '../../identity-management-oauth.service';
import { KeycloakAdministrationService } from './keycloak-administration.service';

@Injectable()
export class KeycloakIdentityManagementOauthService extends IdentityManagementOauthService {
	private _oauthConfigCache: OauthConfigDto | undefined;

	constructor(
		private readonly kcAdminService: KeycloakAdministrationService,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService
	) {
		super();
	}

	resetOauthConfigCache(): void {
		this._oauthConfigCache = undefined;
	}

	async getOauthConfig(): Promise<OauthConfigDto> {
		if (this._oauthConfigCache) {
			return this._oauthConfigCache;
		}
		const kc = await this.kcAdminService.callKcAdminClient();
		const wellKnownUrl = `${kc.baseUrl}/realms/${kc.realmName}/.well-known/openid-configuration`;
		const response = (await lastValueFrom(this.httpService.get<Record<string, unknown>>(wellKnownUrl))).data;
		const scDomain = this.configService.get<string>('SC_DOMAIN');
		const redirectUri =
			scDomain === 'localhost' ? 'http://localhost:3030/api/v3/sso/oauth/' : `https://${scDomain}/api/v3/sso/oauth/`;
		this._oauthConfigCache = new OauthConfigDto({
			clientId: kc.keycloak?.clientId || '',
			clientSecret: kc.keycloak?.clientSecret || '',
			provider: 'oauth',
			redirectUri,
			responseType: 'code',
			grantType: 'authorization_code',
			scope: 'openid profile email',
			issuer: response.issuer as string,
			tokenEndpoint: response.token_endpoint as string,
			authEndpoint: response.authorization_endpoint as string,
			logoutEndpoint: response.end_session_endpoint as string,
			jwksEndpoint: response.jwks_uri as string,
		});
		return this._oauthConfigCache;
	}

	async isOauthConfigAvailable(): Promise<boolean> {
		if (this._oauthConfigCache) {
			return true;
		}
		return this.kcAdminService.testKcConnection();
	}

	async resourceOwnerPasswordGrant(username: string, password: string): Promise<string | undefined> {
		const { clientId, clientSecret, tokenEndpoint } = await this.getOauthConfig();
		const data = {
			username,
			password,
			grant_type: 'password',
			client_id: clientId,
			client_secret: clientSecret,
		};
		try {
			const response = await lastValueFrom(
				this.httpService.request<{ access_token: string }>({
					method: 'post',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					url: tokenEndpoint,
					data: qs.stringify(data),
				})
			);
			return response.data.access_token;
		} catch (err) {
			return undefined;
		}
	}
}
