import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
// TODO: optimize imports
import { ClientCredentialsGrantTokenRequest } from '@modules/oauth/service/dto';
import { OAuthGrantType } from '@modules/oauth/interface/oauth-grant-type.enum';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { lastValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MediaSource, MediaSourceSyncOperationReport, MediaSourceSyncReport } from '../../../domain';
import { MediaSourceDataFormat, MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../../enum';
import { MediaSourceNotFoundLoggableException } from '../../../loggable';
import { BiloMediaQueryParams } from '../../../domain/request';
import { BiloMediaQueryResponse } from '../../../domain/response';
import { MediaSourceService } from '../../media-source.service';

// TODO: resolve circular imports
// @Injectable()
export class BiloSyncStrategy {
	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService,
		private readonly externalToolService: ExternalToolService
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	public async syncAllMediaMetadata(): Promise<MediaSourceSyncReport> {
		const report: MediaSourceSyncReport = {
			totalCount: 0,
			successCount: 0,
			failedCount: 0,
			undeliveredCount: 0,
			operations: [],
		};

		const mediaSource = await this.getMediaSource();

		const externalTools: ExternalTool[] = await this.getAllToolsWithBiloMedium(mediaSource);
		const mediumIds = externalTools
			.map((externalTool: ExternalTool) => externalTool.medium?.mediumId)
			.filter((mediumId: string | undefined): mediumId is string => !!mediumId);
		report.totalCount = mediumIds.length;

		const token = await this.fetchAccessToken(mediaSource);

		const metadata: BiloMediaQueryResponse = await this.fetchMediaMetadata(mediumIds, token);

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

	private async getAllToolsWithBiloMedium(mediaSource: MediaSource): Promise<ExternalTool[]> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		return externalTools;
	}

	private async fetchMediaMetadata(mediumIds: string[], token: OAuthTokenDto): Promise<BiloMediaQueryResponse> {
		// TODO: think about where to put this (env var, db?)
		const url = new URL('https://www.bildungslogin-test.de/api/external/univention/media/query');

		const body = [new BiloMediaQueryParams({ id: 'test' })];

		const observable: Observable<AxiosResponse<BiloMediaQueryResponse>> = this.httpService.post(url.toString(), body, {
			headers: {
				Authorization: `Bearer ${token.accessToken}`,
				'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
			},
		});

		const responseToken: AxiosResponse<BiloMediaQueryResponse> = await lastValueFrom(observable);

		return responseToken.data;
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

	private async syncExternalToolMediaMetadata(
		externalTool: ExternalTool,
		metadata: BiloMediaQueryResponse
	): Promise<MediaSourceSyncOperationReport> {
		return {
			operation: MediaSourceSyncOperation.ANY,
			status: MediaSourceSyncStatus.UNDELIVERED,
			count: 1,
		};
	}
}
