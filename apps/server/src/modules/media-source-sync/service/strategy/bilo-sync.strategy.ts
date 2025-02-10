import { Injectable } from '@nestjs/common';
import { BiloMediaRestClient, BiloMediaQueryResponse } from '@infra/bilo-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium, FileRecordRef } from '@modules/tool/external-tool/domain';
import { MediaSourceSyncStrategy, MediaSourceSyncReport, MediaSourceSyncOperationReport } from '../../interface';
import { MediaSourceSyncReportFactory, MediaSourceSyncOperationReportFactory } from '../../factory';
import { MediaSourceSyncOperation } from '../../types';

@Injectable()
export class BiloSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly biloMediaFetchService: BiloMediaRestClient
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

		const metadataItems: BiloMediaQueryResponse[] = await this.biloMediaFetchService.fetchMediaMetadata(
			mediumIds,
			mediaSource
		);

		const report: MediaSourceSyncReport = await this.syncExternalToolMediaMetadata(externalTools, metadataItems);

		return report;
	}

	private async getAllToolsWithBiloMedium(mediaSource: MediaSource): Promise<ExternalTool[]> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		return externalTools;
	}

	private async syncExternalToolMediaMetadata(
		externalTools: ExternalTool[],
		metadataItems: BiloMediaQueryResponse[]
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
				(metadataItem: BiloMediaQueryResponse) => externalTool.medium?.mediumId === metadataItem.id
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
				await this.mapBiloResponseToExternalTool(externalTool, fetchedMetadata);
			} catch (error) {
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

	private isMetadataUpToDate(externalTool: ExternalTool, metadata: BiloMediaQueryResponse): boolean {
		const isUpToDate =
			externalTool.medium?.metadataModifiedAt &&
			Math.trunc(externalTool.medium.metadataModifiedAt.getTime() / 1000) === metadata.modified;

		return !!isUpToDate;
	}

	private async mapBiloResponseToExternalTool(
		externalTool: ExternalTool,
		metadataItem: BiloMediaQueryResponse
	): Promise<void> {
		externalTool.name = metadataItem.title;
		externalTool.description = metadataItem.description;
		externalTool.logoUrl = metadataItem.cover.href;

		const medium = externalTool.medium as ExternalToolMedium;
		medium.publisher = metadataItem.publisher;
		medium.metadataModifiedAt = new Date(metadataItem.modified * 1000);

		externalTool.thumbnail = await this.updateExternalToolThumbnail(externalTool, metadataItem.coverSmall.href);
	}

	private async updateExternalToolThumbnail(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		externalTool: ExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		thumbnailUrl: string
	): Promise<FileRecordRef | undefined> {
		// TODO N21-2398 updating thumbnail requires jwt (not possible for now)
		await Promise.resolve();

		return undefined;
	}
}
