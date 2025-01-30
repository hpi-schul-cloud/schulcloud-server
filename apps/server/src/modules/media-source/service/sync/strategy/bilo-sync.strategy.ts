import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MediaSource, MediaSourceSyncReport } from '../../../domain';
import { MediaSourceDataFormat } from '../../../enum';
import { BiloMediaQueryResponse } from '@modules/media-source/domain/response/bilo-media-query.response';
import { MediaSourceService } from '../../media-source.service';
import { MediaSourceNotFoundLoggableException } from '@modules/media-source';
import { ClientCredentialsGrantTokenRequest } from '@modules/oauth/service/dto';
import { OAuthGrantType } from '@modules/oauth/interface/oauth-grant-type.enum';
import { BiloMediaQueryParams } from '@modules/media-source/domain/request';

@Injectable()
export class BiloSyncStrategy {
	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService
	) {}

	public async syncAllMediaMetadata(): Promise<MediaSourceSyncReport> {
		const mediaSource = this.getMediaSource();

		const report: MediaSourceSyncReport = {
			totalCount: 0,
			successCount: 0,
			failedCount: 0,
			undeliveredCount: 0,
			operations: [],
		};

		return report;
	}

	private async getMediaSource(): Promise<MediaSource> {
		const format = this.getMediaSourceFormat();

		const mediaSource = await this.mediaSourceService.findByFormat(format);

		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(format);
		}

		return mediaSource;
	}

	private async fetchModifiedMediaList(): Promise<void> {}

	private async fetchMediaMetadata(): Promise<BiloMediaQueryResponse> {
		// TODO: think about where to put this (env var, db?)
		const url = new URL('https://www.bildungslogin-test.de/api/external/univention/media/query');

		const body = [new BiloMediaQueryParams({ id: 'test' })];

		const response = await this.postBiloMediaRequest<BiloMediaQueryResponse>(url, body, 'test');

		return response;
	}

	private async fetchAccessToken(mediaSource: MediaSource): Promise<OAuthTokenDto> {
		const oauthConfig = mediaSource.oauthConfig;

		if (!oauthConfig) {
			// 	TODO error
			throw new Error();
		}

		const credentials = new ClientCredentialsGrantTokenRequest({
			client_id: oauthConfig.clientId,
			client_secret: oauthConfig.clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const accessToken = await this.oauthAdapterService.sendTokenRequest(oauthConfig.authEndpoint, credentials);

		return accessToken;
	}

	private async postBiloMediaRequest<T>(url: URL, body: object, accessToken: string): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService.post(url.toString(), body, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
			},
		});

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}
}
