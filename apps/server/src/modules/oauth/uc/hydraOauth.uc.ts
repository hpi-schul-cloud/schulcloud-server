import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OauthConfig } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto';
import { HydraRedirectDto } from '@src/modules/oauth/service/dto/hydra.redirect.dto';
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
