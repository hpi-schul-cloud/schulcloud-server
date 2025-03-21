import { Logger } from '@core/logger';
import { BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { ExternalToolLogoService } from '@modules/tool/external-tool/service/external-tool-logo.service';
import { Injectable } from '@nestjs/common';
import { MediaSourceSyncOperationReportFactory, MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport, MediaSourceSyncStrategy } from '../../interface';
import { BiloMediaMetadataSyncFailedLoggable } from '../../loggable/bilo-media-metadata-sync-failed-loggable.exception';
import { MediaSourceSyncOperation } from '../../types';

@Injectable()
export class BiloSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly biloMediaClientAdapter: BiloMediaClientAdapter,
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolValidationService: ExternalToolValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService,
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

		const metadataItems: BiloMediaQueryDataResponse[] = await this.biloMediaClientAdapter.fetchMediaMetadata(
			mediumIds,
			mediaSource,
			false
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
				externalTool = await this.buildExternalToolMetadataUpdate(externalTool, fetchedMetadata);
			} catch (error: unknown) {
				this.logger.debug(
					new BiloMediaMetadataSyncFailedLoggable(
						externalTool.medium?.mediumId as string,
						externalTool.medium?.mediaSourceId as string
					)
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

		const isUpToDate = externalTool.medium.metadataModifiedAt.getTime() >= metadata.modified;

		return isUpToDate;
	}

	private async buildExternalToolMetadataUpdate(
		externalTool: ExternalTool,
		metadata: BiloMediaQueryDataResponse
	): Promise<ExternalTool> {
		externalTool.name = metadata.title;
		externalTool.description = metadata.description;
		externalTool.logoUrl = metadata.coverSmall.href;
		externalTool.logo = await this.externalToolLogoService.fetchLogo({ logoUrl: metadata.cover.href });

		if (externalTool.medium) {
			externalTool.medium.publisher = metadata.publisher;
			externalTool.medium.metadataModifiedAt = new Date(metadata.modified);
		}

		await this.externalToolValidationService.validateUpdate(externalTool.id, externalTool);

		return externalTool;
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
