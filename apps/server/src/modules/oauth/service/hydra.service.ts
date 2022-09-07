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

@Injectable()
export class HydraSsoService {
	constructor(private readonly ltiRepo: LtiToolRepo, private readonly httpService: HttpService) {}

	async requestAuthToken(config: OauthConfig, userId: string, currJwt: string): Promise<AuthorizationParams> {
		const query = QueryString.stringify({
			response_type: config.responseType,
			scope: config.scope,
			client_id: config.clientId,
			redirect_uri: config.redirectUri,
			state: 'GARGARGAR',
		});

		const axiosConfig: AxiosRequestConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: (status: number) => {
				return status === 200 || status === 302;
			},
		};
		let respObservable = this.httpService.get<AuthorizationParams>(`${config.authEndpoint}?${query}`, axiosConfig);
		let resp = await firstValueFrom(respObservable);
		let referer = resp.headers.location;

		if (axiosConfig.headers) {
			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			respObservable = this.httpService.get(resp.headers.location, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);

			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `http://localhost:3100${resp.headers.location}`;
			respObservable = this.httpService.get(`http://localhost:3100${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);

			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `http://localhost:3100${resp.headers.location}`;
			respObservable = this.httpService.get(`http://localhost:3100${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);

			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `http://localhost:3100${resp.headers.location}`;
			respObservable = this.httpService.get(`http://localhost:3100${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);

			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `${resp.headers.location}`;
			respObservable = this.httpService.get(`${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);

			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `${resp.headers.location}`;
			respObservable = this.httpService.get(`${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);

			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `${resp.headers.location}`;
			respObservable = this.httpService.get(`${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.headers);
			if (resp.headers['set-cookie']) {
				this.processCookies(resp.headers['set-cookie']);
			}
			if (resp.headers.location.includes('hydra.localhost:9000')) {
				axiosConfig.headers.Cookie = this.hydraCookie;
			} else {
				axiosConfig.headers.Cookie = this.dbcCookie;
			}
			axiosConfig.headers.Referer = referer;
			referer = `${resp.headers.location}`;
			respObservable = this.httpService.get(`${resp.headers.location}`, axiosConfig);
			resp = await firstValueFrom(respObservable);
			this.logger.debug(resp.data);
		}
		return resp.data;
	}

	processCall(location: string, referer: string, cookies: CookiesDto, axiosConfig: AxiosRequestConfig): AxiosResponse {
		if (!axiosConfig.headers) throw new InternalServerErrorException();
		if (location.startsWith(Configuration.get('HYDRA_URI') as string)) {
			axiosConfig.headers.Cookie = cookies.hydraCookie;
		} else {
			axiosConfig.headers.Cookie = cookies.localCookie;
		}
		axiosConfig.headers.Referer = referer;
		const respObservable = this.httpService.get(location, axiosConfig);
		const res: AxiosResponse = firstValueFrom(respObservable)
			.then((resp) => {
				return resp;
			})
			.catch((err) => {
				throw new InternalServerErrorException(err);
			});
		return res;
	}

	async generateConfig(ltiToolId: string): Promise<OauthConfig> {
		const tool: LtiToolDO = await this.ltiRepo.findById(ltiToolId);

		if (!tool.oAuthClientId || !tool.secret) {
			throw new NotFoundException(ltiToolId, 'Suitable tool not found!');
		}

		const hydraOauthConfig = new OauthConfig({
			authEndpoint: '',
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
}
