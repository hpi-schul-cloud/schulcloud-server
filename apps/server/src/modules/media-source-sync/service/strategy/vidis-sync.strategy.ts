import { AxiosErrorLoggable, ErrorLoggable } from '@core/error/loggable';
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
import { ImageMimeType } from '@modules/tool/common';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { MediaSourceSyncOperationReportFactory, MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport, MediaSourceSyncStrategy } from '../../interface';
import { MediaSourceSyncOperation } from '../../types';

@Injectable()
export class VidisSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly encryptionService: EncryptionService,
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly externalToolValidationService: ExternalToolValidationService,
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

		const report: MediaSourceSyncReport = await this.syncExternalToolMediumMetadata(externalTools, vidisMediaMetadata);

		return report;
	}

	private async getAllToolsWithVidisMedium(mediaSource: MediaSource): Promise<ExternalTool[]> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		return externalTools;
	}

	private async syncExternalToolMediumMetadata(
		externalTools: ExternalTool[],
		metadataItemsFromVidis: OfferDTO[]
	): Promise<MediaSourceSyncReport> {
		const updateSuccessReport = MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(
			MediaSourceSyncOperation.UPDATE
		);
		const failureReport = MediaSourceSyncOperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY);
		const undeliveredReport = MediaSourceSyncOperationReportFactory.buildUndeliveredReport();

		const updatePromises = externalTools.map(async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
			const fetchedMetadata = metadataItemsFromVidis.find(
				(metadataFromVidis: OfferDTO) => externalTool.medium?.mediumId === metadataFromVidis.offerId?.toString()
			);

			if (!fetchedMetadata) {
				undeliveredReport.count += 1;
				return null;
			}

			try {
				this.mapVidisMetadataToExternalToolMedium(externalTool, fetchedMetadata);
				await this.externalToolValidationService.validateUpdate(externalTool.id, externalTool);
			} catch (error: unknown) {
				// TODO loggable
				this.logger.debug(
					new ErrorLoggable(error, {
						mediumId: externalTool.medium?.mediumId as string,
						mediumMediaSourceId: externalTool.medium?.mediaSourceId as string,
					})
				);
				failureReport.count += 1;
				return null;
			}

			updateSuccessReport.count += 1;

			return externalTool;
		});

		const updatedExternalTools: ExternalTool[] = (await Promise.all(updatePromises)).filter(
			(updateResult: ExternalTool | null) => !!updateResult
		);

		await this.externalToolService.updateExternalTools(updatedExternalTools);

		const report: MediaSourceSyncReport = MediaSourceSyncReportFactory.buildFromOperations([
			updateSuccessReport,
			failureReport,
			undeliveredReport,
		]);

		return report;
	}

	private mapVidisMetadataToExternalToolMedium(externalTool: ExternalTool, vidisMetadata: OfferDTO): void {
		if (vidisMetadata.offerTitle) {
			externalTool.name = vidisMetadata.offerTitle;
		}

		if (vidisMetadata.offerLogo) {
			externalTool.logoUrl = this.buildDataUriFromBase64(vidisMetadata.offerLogo);
		}

		externalTool.description = vidisMetadata.offerDescription;

		const medium = externalTool.medium as ExternalToolMedium;
		medium.publisher = vidisMetadata.educationProviderOrganizationName;
	}

	private buildDataUriFromBase64(rawBase64: string): string {
		const contentType: ImageMimeType = this.externalToolLogoService.detectAndValidateImageContentType(rawBase64);

		const dataURI = `data:${contentType.valueOf()};base64,${rawBase64}`;

		return dataURI;
	}

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
