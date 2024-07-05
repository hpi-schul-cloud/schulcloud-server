import { OauthConfigEntity } from '@modules/system/entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthorizationParams } from '../controller/dto';
import { OAuthTokenDto } from '../interface';
import { AuthCodeFailureLoggableException } from '../loggable';
import { HydraSsoService, OAuthService } from '../service';
import { HydraRedirectDto } from '../service/dto';

/**
 * @deprecated To be removed in N21-2071
 */
@Injectable()
export class HydraOauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly hydraSsoService: HydraSsoService,
		private logger: LegacyLogger
	) {
		this.logger.setContext(HydraOauthUc.name);
	}

	private readonly MAX_REDIRECTS: number = 10;

	async getOauthToken(oauthClientId: string, code?: string, error?: string): Promise<OAuthTokenDto> {
		if (error || !code) {
			throw new AuthCodeFailureLoggableException(error);
		}
		const hydraOauthConfig: OauthConfigEntity = await this.hydraSsoService.generateConfig(oauthClientId);

		const oauthTokens: OAuthTokenDto = await this.oauthService.requestToken(
			code,
			hydraOauthConfig,
			hydraOauthConfig.redirectUri
		);

		await this.oauthService.validateToken(oauthTokens.idToken, hydraOauthConfig);

		return oauthTokens;
	}

	protected validateStatus = (status: number): boolean => status === 200 || status === 302;

	async requestAuthCode(jwt: string, oauthClientId: string): Promise<AuthorizationParams> {
		const hydraOauthConfig: OauthConfigEntity = await this.hydraSsoService.generateConfig(oauthClientId);
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
