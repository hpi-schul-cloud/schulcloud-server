import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OauthConfig } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
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

	private readonly MAX_REDIRECTS: number = 10;

	private readonly HYDRA_URI: string = Configuration.get('HYDRA_URI') as string;

	private readonly HOST: string = Configuration.get('HOST') as string;

	async getOauthToken(query: AuthorizationParams, oauthClientId: string): Promise<OauthTokenResponse> {
		const hydraOauthConfig = await this.hydraSsoService.generateConfig(oauthClientId);
		const authCode: string = this.oauthService.checkAuthorizationCode(query);
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, hydraOauthConfig);
		await this.oauthService.validateToken(queryToken.id_token, hydraOauthConfig);
		return queryToken;
	}

	async requestAuthCode(userId: string, jwt: string, oauthClientId: string): Promise<AuthorizationParams> {
		const hydraOauthConfig: OauthConfig = await this.hydraSsoService.generateConfig(oauthClientId);
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
		let referer = '';
		let location: string;
		let currentRedirect = 0;

		resp = await this.hydraSsoService.initAuth(hydraOauthConfig, axiosConfig);

		do {
			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie'], cookies);
			}

			location = resp.headers.location.startsWith('http')
				? resp.headers.location
				: `${this.HOST}${resp.headers.location}`;
			// eslint-disable-next-line no-await-in-loop
			resp = await this.hydraSsoService.processRedirect(location, referer, cookies, axiosConfig);
			referer = location;
			currentRedirect += 1;
		} while (resp.status === 302 && currentRedirect < this.MAX_REDIRECTS);

		const authParams: AuthorizationParams = resp.data as AuthorizationParams;
		return authParams;
	}

	protected processCookies(setCookies: string[], cookies: CookiesDto): void {
		const hydraCookieList: string[] = [];
		const localCookieList: string[] = [];

		setCookies.forEach((item: string): void => {
			const cookie: string = item.split(';')[0];
			if (cookie.startsWith('oauth2') && !cookies.hydraCookie.includes(cookie)) {
				hydraCookieList.push(cookie);
			} else if (!cookies.localCookie.includes(cookie)) {
				localCookieList.push(cookie);
			}
		});

		cookies.hydraCookie.concat('; ', hydraCookieList.join('; '));
		cookies.localCookie.concat('; ', localCookieList.join('; '));
	}
	// TODO
	/* protected processCookies(setCookies: string[], cookies: CookiesDto): void {
		setCookies.forEach((item: string): void => {
			const cookie: string = item.split(';')[0];
			if (cookie.startsWith('oauth2')) {
				if (!cookies.hydraCookie.includes(cookie)) {
					if (cookies.hydraCookie === '') {
						cookies.hydraCookie = cookie;
					} else {
						cookies.hydraCookie = `${cookies.hydraCookie}; ${cookie}`;
					}
				}
			} else if (!cookies.localCookie.includes(cookie)) {
				if (cookies.localCookie === '') {
					cookies.localCookie = cookie;
				} else {
					cookies.localCookie = `${cookies.localCookie}; ${cookie}`;
				}
			}
		});
	} */
}
