import { AxiosErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { EncryptionService } from '@infra/encryption';
import { Configuration, IDMBetreiberApiFactory, OfferDTO, PageOfferDTO } from '@infra/vidis-client';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceVidisConfig,
	MediaSourceVidisConfigNotFoundLoggableException,
} from '@modules/media-source';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport, MediaSourceSyncStrategy } from '../../interface';

@Injectable()
export class VidisSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly encryptionService: EncryptionService,
		private readonly externalToolService: ExternalToolService,
		private readonly logger: Logger
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	public async syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		if (!mediaSource.vidisConfig) {
			throw new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.sourceId, MediaSourceDataFormat.VIDIS);
		}

		const vidisMediaMetadata: OfferDTO[] = await this.fetchMediaMetadata(mediaSource.vidisConfig);

		const externalTools: ExternalTool[] = await this.getAllToolsWithVidisMedium(mediaSource);

		const emptyReport = MediaSourceSyncReportFactory.buildEmptyReport();

		return Promise.resolve(emptyReport);
	}

	private async getAllToolsWithVidisMedium(mediaSource: MediaSource): Promise<ExternalTool[]> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		return externalTools;
	}

	private mapOfferDtoToExternalToolMedium() {}

	private async fetchMediaMetadata(vidisConfig: MediaSourceVidisConfig): Promise<OfferDTO[]> {
		const vidisClient = IDMBetreiberApiFactory(
			new Configuration({
				basePath: vidisConfig.baseUrl,
			})
		);

		const decryptedUsername = this.encryptionService.decrypt(vidisConfig.username);
		const decryptedPassword = this.encryptionService.decrypt(vidisConfig.password);
		const basicAuthEncoded = btoa(`${decryptedUsername}:${decryptedPassword}`);

		try {
			const axiosResponse: AxiosResponse<PageOfferDTO> = await vidisClient.getActivatedOffersByRegion(
				vidisConfig.region,
				undefined,
				undefined,
				{
					headers: { Authorization: `Basic ${basicAuthEncoded}` },
				}
			);
			const offerItems: OfferDTO[] = axiosResponse.data.items ?? [];

			return offerItems;
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'VIDIS_GET_OFFER_ITEMS_FAILED');
			} else {
				throw error;
			}
		}
	}
}
