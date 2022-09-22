import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LtiToolRepo } from '@shared/repo';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import QueryString from 'qs';
import { HttpService } from '@nestjs/axios';
import { nanoid } from 'nanoid';
import { firstValueFrom, Observable } from 'rxjs';
import { HydraRedirectDto } from '@src/modules/oauth/service/dto/hydra.redirect.dto';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';

@Injectable()
export class HydraSsoService {
	constructor(
		private readonly ltiRepo: LtiToolRepo,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService
	) {}

	private readonly HOST: string = Configuration.get('HOST') as string;

	async initAuth(oauthConfig: OauthConfig, axiosConfig: AxiosRequestConfig): Promise<AxiosResponse> {
		const query = QueryString.stringify({
			response_type: oauthConfig.responseType,
			scope: oauthConfig.scope,
			client_id: oauthConfig.clientId,
			redirect_uri: oauthConfig.redirectUri,
			state: nanoid(15),
		});
		console.log(`${oauthConfig.authEndpoint}?${query}`);
		console.log(axiosConfig);
		const res: Promise<AxiosResponse> = this.get(`${oauthConfig.authEndpoint}?${query}`, axiosConfig);
		return res;
	}

	async processRedirect(dto: HydraRedirectDto): Promise<HydraRedirectDto> {
		const localDto: HydraRedirectDto = new HydraRedirectDto(dto);
		let { location } = localDto.response.headers;
		const isLocal = !location.startsWith('http');
		const isHydra = location.startsWith(Configuration.get('HYDRA_PUBLIC_URI') as string);

		// locations of schulcloud cookies are a relative path
		if (isLocal) {
			location = `${this.HOST}${location}`;
		}

		if (localDto.response.headers['set-cookie']) {
			localDto.cookies = this.processCookies(localDto.response.headers['set-cookie'], dto.cookies);
		}

		const headerCookies: string = isHydra
			? localDto.cookies.hydraCookies.join('; ')
			: localDto.cookies.localCookies.join('; ');

		localDto.axiosConfig.headers = {
			Referer: localDto.referer,
			Cookie: headerCookies,
		};
		console.log(localDto);
		localDto.response = await this.get(location, localDto.axiosConfig);
		localDto.referer = location;
		localDto.currentRedirect += 1;

		return localDto;
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
			clientSecret: this.oAuthEncryptionService.encrypt(tool.secret),
			grantType: 'authorization_code',
			issuer: `${hydraUri}/`,
			jwksEndpoint: `${hydraUri}/.well-known/jwks.json`,
			logoutEndpoint: `${hydraUri}/oauth2/sessions/logout`,
			provider: 'hydra',
			redirectUri: `${Configuration.get('HOST') as string}/api/v3/sso/hydra/${oauthClientId}`,
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
