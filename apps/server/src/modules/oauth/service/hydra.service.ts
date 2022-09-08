import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LtiToolRepo } from '@shared/repo';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import QueryString from 'qs';
import { HttpService } from '@nestjs/axios';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class HydraSsoService {
	constructor(private readonly ltiRepo: LtiToolRepo, private readonly httpService: HttpService) {}

	initAuth(oauthConfig: OauthConfig, axiosConfig: AxiosRequestConfig): AxiosResponse {
		const query = QueryString.stringify({
			response_type: oauthConfig.responseType,
			scope: oauthConfig.scope,
			client_id: oauthConfig.clientId,
			redirect_uri: oauthConfig.redirectUri,
			state: nanoid(15),
		});

		const res: AxiosResponse = this.get(`${oauthConfig.authEndpoint}?${query}`, axiosConfig);

		return res;
	}

	processRedirect(resp: AxiosResponse, cookies: CookiesDto, axiosConfig: AxiosRequestConfig): AxiosResponse {
		if (!axiosConfig.headers) throw new InternalServerErrorException();
		if (location.startsWith(Configuration.get('HYDRA_URI') as string)) {
			axiosConfig.headers.Cookie = cookies.hydraCookie;
		} else {
			axiosConfig.headers.Cookie = cookies.localCookie;
		}
		axiosConfig.headers.Referer = referer;

		const res: AxiosResponse = this.get(location, axiosConfig);

		return res;
	}

	async generateConfig(ltiToolId: string): Promise<OauthConfig> {
		const tool: LtiToolDO = await this.ltiRepo.findById(ltiToolId);

		if (!tool.oAuthClientId || !tool.secret) {
			throw new NotFoundException(ltiToolId, 'Suitable tool not found!');
		}

		const hydraOauthConfig = new OauthConfig({
			authEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/auth`,
			clientId: tool.oAuthClientId,
			clientSecret: tool.secret,
			grantType: 'authorization_code',
			issuer: `${Configuration.get('HYDRA_URI') as string}/`,
			jwksEndpoint: `${Configuration.get('HYDRA_URI') as string}/.well-known/jwks.json`,
			logoutEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/sessions/logout`,
			provider: 'hydra',
			redirectUri: `${Configuration.get('API_HOST') as string}/v3/sso/hydra`,
			responseType: 'code',
			scope: Configuration.get('NEXTCLOUD_SCOPES') as string, // Only Nextcloud is currently supported
			tokenEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/token`,
		});

		return hydraOauthConfig;
	}

	private get(url: string, axiosConfig: AxiosRequestConfig): AxiosResponse {
		const respObservable = this.httpService.get<AuthorizationParams>(url, axiosConfig);
		const res: AxiosResponse = firstValueFrom(respObservable)
			.then((resp: AxiosResponse) => {
				return resp;
			})
			.catch((err) => {
				throw new InternalServerErrorException(err);
			});
		return res;
	}
}
