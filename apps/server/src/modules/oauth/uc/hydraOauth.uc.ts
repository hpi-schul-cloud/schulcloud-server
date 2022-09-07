import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { HydraParams } from '@src/modules/oauth/controller/dto/hydra.params';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthService } from '../service/oauth.service';
import { HydraSsoService } from '../service/hydra.service';

@Injectable()
export class HydraOauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly hydraSsoService: HydraSsoService,
		private logger: Logger
	) {
		this.logger.setContext(HydraOauthUc.name);
	}

	async getOauthToken(query: AuthorizationParams, ltiToolId: string): Promise<OauthTokenResponse> {
		const hydraOauthConfig = await this.hydraSsoService.generateConfig(ltiToolId);
		this.logger.debug('Oauth process strated. Next up: checkAuthorizationCode().');
		const authCode: string = this.oauthService.checkAuthorizationCode(query);
		this.logger.debug('Done. Next up: requestToken().');
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, hydraOauthConfig);
		this.logger.debug('Done. Next up: validateToken().');
		await this.oauthService.validateToken(queryToken.id_token, hydraOauthConfig);
		return queryToken;
	}

	async requestAuthCode(userId: string, jwt: string, ltiToolId: any): Promise<AuthorizationParams> {
		const cookies: CookiesDto = new CookiesDto({ localCookie: `jwt=${jwt}`, hydraCookie: '' });
		const axiosConfig: AxiosRequestConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: (status: number) => {
				return status === 200 || status === 302;
			},
		};
		let resp: AxiosResponse;
		let referer;
		do {
			resp = this.hydraSsoService.processCall();
			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie'], cookies);
			}
		} while (resp.status === 302);

		return undefined;
	}

	private processCookies(setCookies: string[], cookies: CookiesDto): void {
		setCookies.forEach((item) => {
			const cookie = item.split(';')[0];
			if (cookie.startsWith('oauth2')) {
				if (!cookies.hydraCookie.includes(cookie)) {
					if (cookies.hydraCookie === '') cookies.hydraCookie = cookie;
					else cookies.hydraCookie = `${cookies.hydraCookie}; ${cookie}`;
				}
			} else if (!cookies.localCookie.includes(cookie)) {
				if (cookies.localCookie === '') cookies.localCookie = cookie;
				else cookies.localCookie = `${cookies.localCookie}; ${cookie}`;
			}
		});
	}
}
