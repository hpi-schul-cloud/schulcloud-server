import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LtiToolRepo } from '@shared/repo';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { InternalServerErrorException } from '@nestjs/common';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import QueryString from 'qs';
import { HttpService } from '@nestjs/axios';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { nanoid } from 'nanoid';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class HydraSsoService {
	constructor(private readonly ltiRepo: LtiToolRepo, private readonly httpService: HttpService) {}

	async initAuth(oauthConfig: OauthConfig, axiosConfig: AxiosRequestConfig): Promise<AxiosResponse> {
		const query = QueryString.stringify({
			response_type: oauthConfig.responseType,
			scope: oauthConfig.scope,
			client_id: oauthConfig.clientId,
			redirect_uri: oauthConfig.redirectUri,
			state: nanoid(15),
		});

		const res: Promise<AxiosResponse> = this.get(`${oauthConfig.authEndpoint}?${query}`, axiosConfig);
		return res;
	}

	async processRedirect(location: string, axiosConfig: AxiosRequestConfig): Promise<AxiosResponse> {
		const res: Promise<AxiosResponse> = this.get(location, axiosConfig);
		return res;
	}

	async generateConfig(oauthClientId: string): Promise<OauthConfig> {
		const tool: LtiToolDO = await this.ltiRepo.findByOauthClientId(oauthClientId);

		// Needs to be checked, because the fields can be undefined
		if (!tool.oAuthClientId || !tool.secret) {
			throw new InternalServerErrorException(oauthClientId, 'Suitable tool not found!');
		}

		const hydraUri: string = Configuration.get('HYDRA_PUBLIC_URI') as string;
		const hydraOauthConfig = new OauthConfig({
			authEndpoint: `${hydraUri}/oauth2/auth`,
			clientId: tool.oAuthClientId,
			clientSecret: tool.secret,
			grantType: 'authorization_code',
			issuer: `${hydraUri}/`,
			jwksEndpoint: `${hydraUri}/.well-known/jwks.json`,
			logoutEndpoint: `${hydraUri}/oauth2/sessions/logout`,
			provider: 'hydra',
			redirectUri: `${Configuration.get('API_HOST') as string}/v3/sso/hydra/${oauthClientId}`,
			responseType: 'code',
			scope: Configuration.get('NEXTCLOUD_SCOPES') as string, // Only Nextcloud is currently supported
			tokenEndpoint: `${hydraUri}/oauth2/token`,
		});

		return hydraOauthConfig;
	}

	private get(url: string, axiosConfig: AxiosRequestConfig): Promise<AxiosResponse> {
		const respObservable: Observable<AxiosResponse> = this.httpService.get<AuthorizationParams>(url, axiosConfig);
		const res: Promise<AxiosResponse> = firstValueFrom(respObservable);
		return res;
	}
}
