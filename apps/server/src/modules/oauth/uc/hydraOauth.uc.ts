import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
		const axiosConfig: AxiosRequestConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: (status: number) => {
				return status === 200 || status === 302;
			},
		};

		let response: AxiosResponse;
		let currentRedirect = 0;
		let referer = '';

		response = await this.hydraSsoService.initAuth(hydraOauthConfig, axiosConfig);

		do {
			let { location } = response.headers;
			const isHydra = location.startsWith(Configuration.get('HYDRA_URI') as string);

			// locations of schulcloud cookies are a relative path
			if (!isHydra) {
				location = `${this.HOST}${location}`;
			}

			const cookies: CookiesDto = new CookiesDto({ localCookies: [], hydraCookies: [] });
			if (response.headers['set-cookie']) {
				const extractedCookies: CookiesDto = this.processCookies(response.headers['set-cookie']);
				cookies.localCookies = extractedCookies.localCookies;
				cookies.hydraCookies = extractedCookies.hydraCookies;
			}
			cookies.localCookies.push(`jwt=${jwt}`);

			const headerCookies: string = isHydra ? cookies.hydraCookies.join('; ') : cookies.localCookies.join('; ');

			axiosConfig.headers = {
				Referer: referer,
				Cookie: headerCookies,
			};

			// eslint-disable-next-line no-await-in-loop
			response = await this.hydraSsoService.processRedirect(location, axiosConfig);
			referer = location;
			currentRedirect += 1;
		} while (response.status === 302 && currentRedirect < this.MAX_REDIRECTS);

		if (currentRedirect >= this.MAX_REDIRECTS) {
			throw new InternalServerErrorException(`Redirect limit of ${this.MAX_REDIRECTS} exceeded.`);
		}

		if (!(response.data instanceof AuthorizationParams)) {
			throw new InternalServerErrorException(
				`Invalid response after authorization process for user ${userId} on oauth client ${oauthClientId}.`
			);
		}

		const authParams: AuthorizationParams = response.data;
		return authParams;
	}

	protected processCookies(setCookies: string[]): CookiesDto {
		const localCookies: string[] = [];
		const hydraCookies: string[] = [];

		setCookies.forEach((item: string): void => {
			const cookie: string = item.split(';')[0];
			if (cookie.startsWith('oauth2')) {
				hydraCookies.push(cookie);
			} else {
				localCookies.push(cookie);
			}
		});

		const cookiesDto = new CookiesDto({
			localCookies,
			hydraCookies,
		});
		return cookiesDto;
	}
}
