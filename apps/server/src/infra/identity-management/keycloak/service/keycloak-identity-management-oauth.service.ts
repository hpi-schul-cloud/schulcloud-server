import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { OauthConfigDto } from '@modules/system/service/dto';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import qs from 'qs';
import { lastValueFrom } from 'rxjs';
import { IdentityManagementOauthService } from '../../identity-management-oauth.service';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';

@Injectable()
export class KeycloakIdentityManagementOauthService extends IdentityManagementOauthService {
	private _oauthConfigCache: OauthConfigDto | undefined;

	constructor(
		private readonly kcAdminService: KeycloakAdministrationService,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: EncryptionService
	) {
		super();
	}

	async getOauthConfig(): Promise<OauthConfigDto> {
		if (this._oauthConfigCache) {
			return this._oauthConfigCache;
		}
		const wellKnownUrl = this.kcAdminService.getWellKnownUrl();
		const response = (await lastValueFrom(this.httpService.get<Record<string, unknown>>(wellKnownUrl))).data;
		const scDomain = this.configService.get<string>('SC_DOMAIN') || '';
		const redirectUri =
			scDomain === 'localhost' ? 'http://localhost:3030/api/v3/sso/oauth/' : `https://${scDomain}/api/v3/sso/oauth/`;
		const clientId = this.kcAdminService.getClientId();
		const clientSecret = await this.kcAdminService.getClientSecret();
		this._oauthConfigCache = new OauthConfigDto({
			clientId,
			clientSecret: this.oAuthEncryptionService.encrypt(clientSecret),
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

	resetOauthConfigCache(): void {
		this._oauthConfigCache = undefined;
	}

	async isOauthConfigAvailable(): Promise<boolean> {
		if (this._oauthConfigCache) {
			return true;
		}
		return this.kcAdminService.testKcConnection();
	}

	async resourceOwnerPasswordGrant(username: string, password: string): Promise<string | undefined> {
		try {
			const { clientId, clientSecret, tokenEndpoint } = await this.getOauthConfig();
			const data = {
				username,
				password,
				grant_type: 'password',
				client_id: clientId,
				client_secret: this.oAuthEncryptionService.decrypt(clientSecret),
			};
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
