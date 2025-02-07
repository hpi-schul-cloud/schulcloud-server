import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosErrorLoggable } from '@core/error/loggable';
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
import { AxiosResponse, isAxiosError } from 'axios';
import { BiloMediaQueryBodyParams } from './request';
import { BiloMediaQueryResponse } from './response';

@Injectable()
export class BiloMediaRestClient {
	constructor(
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async fetchMediaMetadata(
		mediumIds: string[],
		biloMediaSource: MediaSource
	): Promise<BiloMediaQueryResponse[]> {
		if (!biloMediaSource.oauthConfig) {
			throw new MediaSourceOauthConfigNotFoundLoggableException(
				biloMediaSource.id,
				MediaSourceDataFormat.BILDUNGSLOGIN
			);
		}

		const url = new URL(`${biloMediaSource.oauthConfig.baseUrl}/query`);

		const body: BiloMediaQueryBodyParams[] = mediumIds.map((id: string) => new BiloMediaQueryBodyParams({ id }));

		const token: OAuthTokenDto = await this.fetchAccessToken(biloMediaSource);

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

		try {
			const response: AxiosResponse<BiloMediaQueryResponse[]> = await lastValueFrom(observable);
			return response.data;
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'BILO_GET_MEDIA_METADATA_FAILED');
			} else {
				throw error;
			}
		}
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
