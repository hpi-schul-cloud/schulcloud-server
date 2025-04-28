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
import { BiloMediaMetadataSyncFailedLoggable } from '../../loggable';
import { MediaSourceSyncOperation } from '../../types';

@Injectable()
export class BiloMetadataSyncStrategy implements MediaSourceSyncStrategy {
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
		const statusReports = {
			createSuccess: MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.CREATE),
			updateSuccess: MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.UPDATE),
			failure: MediaSourceSyncOperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY),
			undelivered: MediaSourceSyncOperationReportFactory.buildUndeliveredReport(),
		};

		const updatePromises = externalTools.map(async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
			const metadata = metadataItems.find(
				(item: BiloMediaQueryDataResponse) => externalTool.medium?.mediumId === item.id
			);

			if (!metadata) {
				statusReports.undelivered.count++;
				return null;
			}

			if (this.isMetadataUpToDate(externalTool, metadata)) {
				statusReports.updateSuccess.count++;
				return null;
			}

			const isFirstSync = !externalTool.medium?.metadataModifiedAt;
			try {
				externalTool = await this.buildExternalToolMetadataUpdate(externalTool, metadata);
				isFirstSync ? statusReports.createSuccess.count++ : statusReports.updateSuccess.count++;
				return externalTool;
			} catch (error: unknown) {
				this.logger.debug(
					new BiloMediaMetadataSyncFailedLoggable(
						externalTool.medium?.mediumId || 'unknown',
						externalTool.medium?.mediaSourceId || 'unknown',
						error
					)
				);
				statusReports.failure.count++;
				return null;
			}
		});

		const updatedExternalTools: ExternalTool[] = (await Promise.all(updatePromises)).filter(
			(updateResult: ExternalTool | null) => !!updateResult
		);

		await this.externalToolService.updateExternalTools(updatedExternalTools);

		const syncStatusReport: MediaSourceSyncReport = MediaSourceSyncReportFactory.buildFromOperations([
			statusReports.createSuccess,
			statusReports.updateSuccess,
			statusReports.failure,
			statusReports.undelivered,
		]);

		return syncStatusReport;
	}

	private isMetadataUpToDate(externalTool: ExternalTool, metadata: BiloMediaQueryDataResponse): boolean {
		const isUpToDate =
			!!externalTool.medium?.metadataModifiedAt &&
			externalTool.medium.metadataModifiedAt.getTime() >= new Date(metadata.modified).getTime();

		return isUpToDate;
	}

	private async buildExternalToolMetadataUpdate(
		externalTool: ExternalTool,
		metadata: BiloMediaQueryDataResponse
	): Promise<ExternalTool> {
		externalTool.name = metadata.title;
		externalTool.description = metadata.description;
		externalTool.logoUrl = metadata.cover.href;
		externalTool.logo = await this.externalToolLogoService.fetchLogo({ logoUrl: metadata.cover.href });

		if (externalTool.medium) {
			externalTool.medium.publisher = metadata.publisher;
			externalTool.medium.metadataModifiedAt = new Date(metadata.modified);
		}

		await this.externalToolValidationService.validateUpdate(externalTool.id, externalTool);

		return externalTool;
	}
}
