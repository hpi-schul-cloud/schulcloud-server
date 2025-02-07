import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceOauthConfig,
	MediaSourceOauthConfigNotFoundLoggableException,
} from '@modules/media-source';
import {
	OAuthTokenDto,
	OauthAdapterService,
	OAuthGrantType,
	ClientCredentialsGrantTokenRequest,
} from '@modules/oauth-adapter';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { BiloMediaQueryBodyParams } from '../request';
import { BiloMediaQueryResponse } from '../response';

@Injectable()
export class BiloMediaFetchService {
	constructor(
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async fetchMediaMetadata(mediumIds: string[], mediaSource: MediaSource): Promise<BiloMediaQueryResponse[]> {
		if (!mediaSource.oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.BILDUNGSLOGIN);
		}

		const url = new URL(`${mediaSource.oauthConfig.baseUrl}/query`);

		const body: BiloMediaQueryBodyParams[] = mediumIds.map((id: string) => new BiloMediaQueryBodyParams({ id }));

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
		const oauthConfig = mediaSource.oauthConfig as MediaSourceOauthConfig;

		const credentials = new ClientCredentialsGrantTokenRequest({
			client_id: oauthConfig.clientId,
			client_secret: this.encryptionService.decrypt(oauthConfig.clientSecret),
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const accessToken: OAuthTokenDto = await this.oauthAdapterService.sendTokenRequest(
			oauthConfig.authEndpoint,
			credentials
		);

		return accessToken;
	}
}
