import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	OAuthTokenDto,
	OauthAdapterService,
	OAuthGrantType,
	ClientCredentialsGrantTokenRequest,
} from '@modules/oauth-adapter';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MediaSource, BiloMediaQueryRequest, BiloMediaQueryResponse } from '../domain';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceOauthConfigNotFoundLoggableException } from '../loggable';

@Injectable()
export class BiloMediaFetchService {
	constructor(
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async fetchMediaMetadata(mediumIds: string[], mediaSource: MediaSource): Promise<BiloMediaQueryResponse[]> {
		const url = new URL(`${mediaSource.sourceId}/query}`);

		const body: BiloMediaQueryRequest[] = mediumIds.map((id: string) => new BiloMediaQueryRequest({ id }));

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
		if (!mediaSource.oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.BILDUNGSLOGIN);
		}

		const credentials = new ClientCredentialsGrantTokenRequest({
			client_id: mediaSource.oauthConfig.clientId,
			client_secret: this.encryptionService.decrypt(mediaSource.oauthConfig.clientSecret),
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const accessToken: OAuthTokenDto = await this.oauthAdapterService.sendTokenRequest(
			mediaSource.oauthConfig.authEndpoint,
			credentials
		);

		return accessToken;
	}
}
