import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { ClientCredentialsGrantTokenRequest } from '@modules/oauth/service/dto';
import { OAuthGrantType } from '@modules/oauth/interface/oauth-grant-type.enum';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MediaSource, BiloMediaQueryParams, BiloMediaQueryResponse } from '../domain';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceOauthConfigNotFoundLoggableException } from '../loggable';

// TODO: resolve circular imports (oauthModule)
@Injectable()
export class BiloMediaFetchService {
	constructor(private readonly httpService: HttpService, private readonly oauthAdapterService: OauthAdapterService) {}

	public async fetchMediaMetadata(mediumIds: string[], mediaSource: MediaSource): Promise<BiloMediaQueryResponse[]> {
		const url = new URL(mediaSource.sourceId);

		const body: BiloMediaQueryParams[] = mediumIds.map((id: string) => new BiloMediaQueryParams({ id }));

		const token: OAuthTokenDto = await this.fetchAccessToken(mediaSource);

		const observable: Observable<AxiosResponse<BiloMediaQueryResponse[]>> = this.httpService.post(
			url.toString(),
			body,
			{
				headers: {
					Authorization: `Bearer ${token.accessToken}`,
					'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
				},
			}
		);

		const response: AxiosResponse<BiloMediaQueryResponse[]> = await lastValueFrom(observable);

		return response.data;
	}

	private async fetchAccessToken(mediaSource: MediaSource): Promise<OAuthTokenDto> {
		const oauthConfig = mediaSource.oauthConfig;

		if (!oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.BILDUNGSLOGIN);
		}

		const credentials = new ClientCredentialsGrantTokenRequest({
			client_id: oauthConfig.clientId,
			client_secret: oauthConfig.clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const accessToken = await this.oauthAdapterService.sendTokenRequest(oauthConfig.authEndpoint, credentials);

		return accessToken;
	}
}
