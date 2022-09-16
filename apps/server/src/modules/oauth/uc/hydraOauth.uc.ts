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

	private readonly HYDRA_PUBLIC_URI: string = Configuration.get('HYDRA_PUBLIC_URI') as string;

	private readonly HOST: string = Configuration.get('HOST') as string;

	async getOauthToken(query: AuthorizationParams, oauthClientId: string): Promise<OauthTokenResponse> {
		const hydraOauthConfig = await this.hydraSsoService.generateConfig(oauthClientId);
		const authCode: string = this.oauthService.checkAuthorizationCode(query);
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, hydraOauthConfig);
		await this.oauthService.validateToken(queryToken.id_token, hydraOauthConfig);
		return queryToken;
	}

	protected validateStatus = (status: number): boolean => {
		return status === 200 || status === 302;
	};

	async requestAuthCode(userId: string, jwt: string, oauthClientId: string): Promise<AuthorizationParams> {
		const hydraOauthConfig: OauthConfig = await this.hydraSsoService.generateConfig(oauthClientId);
		const axiosConfig: AxiosRequestConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: this.validateStatus,
		};

		const initResponse = await this.hydraSsoService.initAuth(hydraOauthConfig, axiosConfig);

		const response: AxiosResponse = await this.processRedirectCascade(initResponse, jwt);

		const authParams: AuthorizationParams = response.data as AuthorizationParams;
		return authParams;
	}

	private async processRedirectCascade(
		initResponse: AxiosResponse,
		jwt: string
	): Promise<AxiosResponse<AuthorizationParams>> {
		let currentRedirect = 0;
		let referer = '';
		let cookies: CookiesDto = new CookiesDto({ localCookies: [`jwt=${jwt}`], hydraCookies: [] });
		let response = initResponse;
		const axiosConfig: AxiosRequestConfig = initResponse.config;

		do {
			let { location } = response.headers;
			const isHydra = location.startsWith(Configuration.get('HYDRA_PUBLIC_URI') as string);

			// locations of schulcloud cookies are a relative path
			if (!isHydra) {
				location = `${this.HOST}${location}`;
			}

			if (response.headers['set-cookie']) {
				cookies = this.processCookies(response.headers['set-cookie'], cookies);
			}

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

		return response;
	}

	protected processCookies(setCookies: string[], cookies: CookiesDto): CookiesDto {
		const { localCookies } = cookies;
		const { hydraCookies } = cookies;

		setCookies.forEach((item: string): void => {
			const cookie: string = item.split(';')[0];
			if (cookie.startsWith('oauth2') && !hydraCookies.includes(cookie)) {
				hydraCookies.push(cookie);
			} else if (!localCookies.includes(cookie)) {
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
