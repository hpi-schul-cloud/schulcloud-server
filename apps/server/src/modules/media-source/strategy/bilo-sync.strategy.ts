import { Injectable } from '@nestjs/common';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MediaSource, MediaSourceSyncOperationReport, MediaSourceSyncReport, BiloMediaQueryResponse } from '../domain';
import { MediaSourceDataFormat, MediaSourceSyncOperation, MediaSourceSyncStatus } from '../enum';
import { MediaSourceNotFoundLoggableException } from '../loggable';
import { MediaSourceService, BiloMediaFetchService } from '../service';

// TODO: resolve circular imports (externalToolModule)
@Injectable()
export class BiloSyncStrategy {
	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly externalToolService: ExternalToolService,
		private readonly biloMediaFetchService: BiloMediaFetchService
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	public async syncAllMediaMetadata(): Promise<MediaSourceSyncReport> {
		const mediaSource = await this.getMediaSource();

		const externalTools: ExternalTool[] = await this.getAllToolsWithBiloMedium(mediaSource);

		const mediumIds = externalTools
			.map((externalTool: ExternalTool) => externalTool.medium?.mediumId)
			.filter((mediumId: string | undefined): mediumId is string => !!mediumId);

		const metadataItems: BiloMediaQueryResponse[] = await this.biloMediaFetchService.fetchMediaMetadata(
			mediumIds,
			mediaSource
		);

		const report: MediaSourceSyncReport = await this.syncExternalToolMediaMetadata(externalTools, metadataItems);

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

	private async syncExternalToolMediaMetadata(
		externalTools: ExternalTool[],
		metadataItems: BiloMediaQueryResponse[]
	): Promise<MediaSourceSyncReport> {
		const { createSuccessReport, updateSuccessReport, undeliveredReport, failureReport } = this.initializeReports();

		const syncPromises: Promise<void>[] = externalTools.map(async (externalTool: ExternalTool) => {
			const targetMetadata = metadataItems.find(
				(metadataItem: BiloMediaQueryResponse) => externalTool.medium?.mediumId === metadataItem.id
			);

			if (!targetMetadata) {
				undeliveredReport.count += 1;
				return;
			}

			await this.updateMediaMetadata(externalTool, targetMetadata);

			if (this.isMetadataNeverSynced(externalTool, targetMetadata)) {
				createSuccessReport.count += 1;
			} else {
				updateSuccessReport.count += 1;
			}
		});

		await Promise.all(syncPromises).catch(() => {
			failureReport.count += 1;
		});

		// FIXME rename total count to expected total count
		const report: MediaSourceSyncReport = {
			totalCount: externalTools.length,
			successCount: createSuccessReport.count + updateSuccessReport.count,
			failedCount: failureReport.count,
			undeliveredCount: undeliveredReport.count,
			operations: [createSuccessReport, updateSuccessReport, undeliveredReport, failureReport],
		};

		return report;
	}

	// FIXME maybe better name?
	private isMetadataNeverSynced(externalTool: ExternalTool, metadata: BiloMediaQueryResponse): boolean {
		const isMetadataNeverSynced =
			externalTool.medium?.metadataModifiedAt &&
			Math.trunc(externalTool.medium.metadataModifiedAt.getTime() / 1000) === metadata.modified;

		return !!isMetadataNeverSynced;
	}

	private initializeReports() {
		// TODO create and use builder/factory
		const createSuccessReport: MediaSourceSyncOperationReport = {
			operation: MediaSourceSyncOperation.CREATE,
			status: MediaSourceSyncStatus.SUCCESS,
			count: 0,
		};

		const updateSuccessReport: MediaSourceSyncOperationReport = {
			operation: MediaSourceSyncOperation.UPDATE,
			status: MediaSourceSyncStatus.SUCCESS,
			count: 0,
		};

		const undeliveredReport: MediaSourceSyncOperationReport = {
			operation: MediaSourceSyncOperation.ANY,
			status: MediaSourceSyncStatus.UNDELIVERED,
			count: 0,
		};

		const failureReport: MediaSourceSyncOperationReport = {
			operation: MediaSourceSyncOperation.ANY,
			status: MediaSourceSyncStatus.FAILED,
			count: 0,
		};

		return { createSuccessReport, updateSuccessReport, undeliveredReport, failureReport };
	}

	private async updateMediaMetadata(externalTool: ExternalTool, metadataItem: BiloMediaQueryResponse): Promise<void> {
		externalTool.name = metadataItem.title;
		externalTool.description = metadataItem.id;
		externalTool.logoUrl = metadataItem.id;
		externalTool.logo = metadataItem.id;

		const medium = externalTool.medium as ExternalToolMedium;
		medium.publisher = metadataItem.publisher;
		medium.metadataModifiedAt = new Date(metadataItem.modified);

		// TODO try to use batch write op
		await this.externalToolService.updateExternalTool(externalTool);
	}
}
