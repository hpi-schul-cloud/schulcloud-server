import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MediaSourceSyncStrategy, MediaSourceSyncReport } from '../../interface';
import { MediaSourceSyncReportFactory, MediaSourceSyncOperationReportFactory } from '../../factory';
import { MediaSourceSyncOperation } from '../../types';
import { MediaMetadataDto } from '../../dto';
import { MediaMetadataMapper } from '../../mapper';

@Injectable()
export class BiloSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly biloMediaFetchService: BiloMediaClientAdapter,
		private readonly externalToolService: ExternalToolService,
		private readonly logger: Logger
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	public async syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		const externalTools: ExternalTool[] = await this.getAllToolsWithBiloMedium(mediaSource);

		if (!externalTools.length) {
			const emptyReport = MediaSourceSyncReportFactory.buildEmptyReport();
			return emptyReport;
		}

		const mediumIds: string[] = externalTools
			.map((externalTool: ExternalTool) => externalTool.medium?.mediumId)
			.filter((mediumId: string | undefined): mediumId is string => !!mediumId);

		const metadataItems: BiloMediaQueryDataResponse[] = await this.biloMediaFetchService.fetchMediaMetadata(
			mediumIds,
			mediaSource
		);

		const report: MediaSourceSyncReport = await this.syncExternalToolMediaMetadata(externalTools, metadataItems);

		return report;
	}

	public async fetchMediaMetadata(mediumId: string, mediaSource: MediaSource): Promise<MediaMetadataDto> {
		const metadataItems: BiloMediaQueryDataResponse[] = await this.biloMediaFetchService.fetchMediaMetadata(
			[mediumId],
			mediaSource
		);

		const mediaMetadataDto: MediaMetadataDto = MediaMetadataMapper.mapToMediaMetadata(metadataItems[0]);

		return mediaMetadataDto;
	}

	private async getAllToolsWithBiloMedium(mediaSource: MediaSource): Promise<ExternalTool[]> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		return externalTools;
	}

	private async syncExternalToolMediaMetadata(
		externalTools: ExternalTool[],
		metadataItems: BiloMediaQueryDataResponse[]
	): Promise<MediaSourceSyncReport> {
		const createSuccessReport = MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(
			MediaSourceSyncOperation.CREATE
		);
		const updateSuccessReport = MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(
			MediaSourceSyncOperation.UPDATE
		);
		const failureReport = MediaSourceSyncOperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY);
		const undeliveredReport = MediaSourceSyncOperationReportFactory.buildUndeliveredReport();

		const updatePromises = externalTools.map(async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
			const fetchedMetadata = metadataItems.find(
				(metadataItem: BiloMediaQueryDataResponse) => externalTool.medium?.mediumId === metadataItem.id
			);

			if (!fetchedMetadata) {
				undeliveredReport.count += 1;
				return null;
			}

			if (this.isMetadataUpToDate(externalTool, fetchedMetadata)) {
				updateSuccessReport.count += 1;
				return null;
			}

			const isMetadataFirstSync = !externalTool.medium?.metadataModifiedAt;

			try {
				await this.mapBiloMetadataToExternalTool(externalTool, fetchedMetadata);
			} catch (error: unknown) {
				this.logger.debug(
					new ErrorLoggable(error, {
						mediumId: externalTool.medium?.mediumId as string,
						mediumMediaSourceId: externalTool.medium?.mediaSourceId as string,
					})
				);
				failureReport.count += 1;
				return null;
			}

			if (isMetadataFirstSync) {
				createSuccessReport.count += 1;
			} else {
				updateSuccessReport.count += 1;
			}

			return externalTool;
		});

		const updatedExternalTools: ExternalTool[] = (await Promise.all(updatePromises)).filter(
			(updateResult: ExternalTool | null) => !!updateResult
		);

		await this.externalToolService.updateExternalTools(updatedExternalTools);

		const report: MediaSourceSyncReport = MediaSourceSyncReportFactory.buildFromOperations([
			createSuccessReport,
			updateSuccessReport,
			failureReport,
			undeliveredReport,
		]);

		return report;
	}

	private isMetadataUpToDate(externalTool: ExternalTool, metadata: BiloMediaQueryDataResponse): boolean {
		if (!externalTool.medium || !externalTool.medium.metadataModifiedAt) {
			return false;
		}

		const isUpToDate =
			externalTool.name === metadata.title &&
			externalTool.description === metadata.description &&
			externalTool.logoUrl === metadata.coverSmall.href &&
			externalTool.medium.publisher === metadata.publisher &&
			externalTool.medium.metadataModifiedAt.getTime() === metadata.modified;

		return isUpToDate;
	}

	private async mapBiloMetadataToExternalTool(
		externalTool: ExternalTool,
		metadataItem: BiloMediaQueryDataResponse
	): Promise<void> {
		externalTool.name = metadataItem.title;
		externalTool.description = metadataItem.description;
		externalTool.logoUrl = metadataItem.coverSmall.href;

		const medium = externalTool.medium as ExternalToolMedium;
		medium.publisher = metadataItem.publisher;
		medium.metadataModifiedAt = new Date(metadataItem.modified);

		await this.updateExternalToolThumbnail(externalTool, metadataItem.cover.href);
	}

	private async updateExternalToolThumbnail(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		externalTool: ExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		thumbnailUrl: string
	): Promise<void> {
		// TODO N21-2398 updating thumbnail requires jwt (not possible for now)
		await Promise.resolve();
	}
}
