import { Injectable } from '@nestjs/common';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium, FileRecordRef } from '@modules/tool/external-tool/domain';
import { MediaSourceSyncStrategy, MediaSourceSyncReport } from '../../interface';
import { BiloMediaQueryResponse } from '../../response';
import { MediaSourceSyncReportFactory, MediaSourceSyncOperationReportFactory } from '../../factory';
import { MediaSourceSyncOperation } from '../../types';
import { BiloMediaFetchService } from '../bilo-media-fetch.service';

@Injectable()
export class BiloSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly biloMediaFetchService: BiloMediaFetchService
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

		const syncPromises: Promise<void>[] = externalTools.map(async (externalTool: ExternalTool) => {
			const targetMetadata = metadataItems.find(
				(metadataItem: BiloMediaQueryResponse) => externalTool.medium?.mediumId === metadataItem.id
			);

			if (!targetMetadata) {
				undeliveredReport.count += 1;
				return;
			}

			if (this.isMetadataInToolUpToDate(externalTool, targetMetadata)) {
				updateSuccessReport.count += 1;
				return;
			}

			const isMetadataFirstSync = !externalTool.medium?.metadataModifiedAt;

			await this.updateMediaMetadata(externalTool, targetMetadata);

			if (isMetadataFirstSync) {
				createSuccessReport.count += 1;
			} else {
				updateSuccessReport.count += 1;
			}
		});

		await Promise.all(syncPromises).catch(() => {
			// FIXME
			failureReport.count += 1;
		});

		const report: MediaSourceSyncReport = MediaSourceSyncReportFactory.buildFromOperations([
			createSuccessReport,
			updateSuccessReport,
			failureReport,
			undeliveredReport,
		]);

		return report;
	}

	private isMetadataInToolUpToDate(externalTool: ExternalTool, metadata: BiloMediaQueryResponse): boolean {
		const isUpToDate =
			externalTool.medium?.metadataModifiedAt &&
			Math.trunc(externalTool.medium.metadataModifiedAt.getTime() / 1000) === metadata.modified;

		return !!isUpToDate;
	}

	private async updateMediaMetadata(externalTool: ExternalTool, metadataItem: BiloMediaQueryResponse): Promise<void> {
		externalTool.name = metadataItem.title;
		externalTool.description = metadataItem.description;
		externalTool.logoUrl = metadataItem.cover.href;
		// TODO updating thumbnail requires jwt (not possible for now)
		// externalTool.thumbnail = metadataItem.coverSmall.href;

		const medium = externalTool.medium as ExternalToolMedium;
		medium.publisher = metadataItem.publisher;
		medium.metadataModifiedAt = new Date(metadataItem.modified);

		// TODO try to use batch write op
		await this.externalToolService.updateExternalTool(externalTool);
	}
}
