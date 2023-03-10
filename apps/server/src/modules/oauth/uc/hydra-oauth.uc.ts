import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OauthConfig } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { HydraRedirectDto } from '@src/modules/oauth/service/dto/hydra.redirect.dto';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { SSOErrorCode } from '../error/sso-error-code.enum';
import { HydraSsoService } from '../service/hydra.service';
import { OAuthService } from '../service/oauth.service';

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

	async getOauthToken(oauthClientId: string, code?: string, error?: string): Promise<OauthTokenResponse> {
		const hydraOauthConfig = await this.hydraSsoService.generateConfig(oauthClientId);
		if (!code) {
			throw new OAuthSSOError('Authorization in external system failed', error || SSOErrorCode.SSO_AUTH_CODE_STEP);
		}
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(code, hydraOauthConfig);
		await this.oauthService.validateToken(queryToken.id_token, hydraOauthConfig);
		return queryToken;
	}

	protected validateStatus = (status: number): boolean => status === 200 || status === 302;

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
		let dto = new HydraRedirectDto({
			currentRedirect: 0,
			referer: '',
			cookies: { localCookies: [`jwt=${jwt}`], hydraCookies: [] },
			response: initResponse,
			axiosConfig: initResponse.config,
		});

		do {
			// eslint-disable-next-line no-await-in-loop
			dto = await this.hydraSsoService.processRedirect(dto);
		} while (dto.response.status === 302 && dto.currentRedirect < this.MAX_REDIRECTS);

		if (dto.currentRedirect >= this.MAX_REDIRECTS) {
			throw new InternalServerErrorException(`Redirect limit of ${this.MAX_REDIRECTS} exceeded.`);
		}
		return dto.response;
	}
}
