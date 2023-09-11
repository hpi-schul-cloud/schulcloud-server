import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
// TODO: Shared should not import from modules
import { OauthConfigDto } from '@src/modules/system/service';
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
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService
	) {
		super();
	}

	async getOauthConfig(): Promise<OauthConfigDto> {
		// TODO: test for errors thrown by this function (eg. the external call)
		if (this._oauthConfigCache) {
			return this._oauthConfigCache;
		}
		const wellKnownUrl = this.kcAdminService.getWellKnownUrl();
		// TODO: split into multiple lines
		// TODO: what happens in error case?
		const response = (await lastValueFrom(this.httpService.get<Record<string, unknown>>(wellKnownUrl))).data;
		const scDomain = this.configService.get<string>('SC_DOMAIN') || '';
		const redirectUri =
			// TODO: set the path more explicitly via an environment variable. when in doubt, ask devops
			scDomain === 'localhost' ? 'http://localhost:3030/api/v3/sso/oauth/' : `https://${scDomain}/api/v3/sso/oauth/`;
		this._oauthConfigCache = new OauthConfigDto({
			clientId: this.kcAdminService.getClientId(),
			// TODO: the await call should better be outside the object definition
			clientSecret: this.oAuthEncryptionService.encrypt(await this.kcAdminService.getClientSecret()),
			provider: 'oauth',
			redirectUri,
			responseType: 'code',
			grantType: 'authorization_code',
			scope: 'openid profile email',
			// TODO: try to avoid as casts
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
		// TODO: what happens when an error is thrown here? should there be a test for this case?
		const { clientId, clientSecret, tokenEndpoint } = await this.getOauthConfig();
		const data = {
			username,
			password,
			grant_type: 'password',
			client_id: clientId,
			client_secret: this.oAuthEncryptionService.decrypt(clientSecret),
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
			// TODO: should not hide this error. All cases I can find where this function is used throw an error in the end.
			// TODO: when you touch the code that is using this, also remember to pass on the error via the cause attribute (there is a util for this)
			return undefined;
		}
	}
}
