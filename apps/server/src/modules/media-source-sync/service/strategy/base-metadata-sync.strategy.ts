import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import {
	ExternalTool,
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolParameterValidationService,
} from '@modules/tool';
import { Injectable } from '@nestjs/common';
import {
	MediaSourceSyncOperationReportFactory as OperationReportFactory,
	MediaSourceSyncReportFactory as ReportFactory,
} from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { MediaSourceSyncOperation } from '../../types';

@Injectable()
export abstract class BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		protected readonly externalToolValidationService: ExternalToolValidationService,
		protected readonly externalToolParameterValidationService: ExternalToolParameterValidationService
	) {}

	public abstract getMediaSourceFormat(): MediaSourceDataFormat;

	public async syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		if (!externalTools.length) {
			const emptyReport: MediaSourceSyncReport = ReportFactory.buildEmptyReport();

			return emptyReport;
		}

		const metadataItems: MediumMetadataDto[] = await this.getMediaMetadata(externalTools, mediaSource);

		const report: MediaSourceSyncReport = await this.syncExternalToolMediumMetadata(externalTools, metadataItems);

		return report;
	}

	protected async getMediaMetadata(
		externalTools: ExternalTool[],
		mediaSource: MediaSource
	): Promise<MediumMetadataDto[]> {
		const mediumIds: string[] = externalTools
			.map((externalTool: ExternalTool) => externalTool.medium?.mediumId)
			.filter((mediumId: string | undefined): mediumId is string => !!mediumId);

		const metadataItems: MediumMetadataDto[] = await this.mediumMetadataService.getMetadataItems(
			mediumIds,
			mediaSource
		);

		return metadataItems;
	}

	protected async syncExternalToolMediumMetadata(
		externalTools: ExternalTool[],
		metadataItems: MediumMetadataDto[]
	): Promise<MediaSourceSyncReport> {
		const statusReports = {
			success: OperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.UPDATE),
			failure: OperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY),
			undelivered: OperationReportFactory.buildUndeliveredReport(),
		};

		const updatePromises: Promise<ExternalTool | null>[] = externalTools.map(
			async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
				const fetchedMetadata: MediumMetadataDto | undefined = metadataItems.find(
					(metadata: MediumMetadataDto): boolean => externalTool.medium?.mediumId === metadata.mediumId
				);

				if (!fetchedMetadata) {
					statusReports.undelivered.count++;
					return null;
				}

				if (this.isMetadataUpToDate(externalTool, fetchedMetadata)) {
					statusReports.success.count++;
					return null;
				}

				try {
					await this.updateExternalToolMetadata(externalTool, fetchedMetadata);

					if (!(await this.externalToolParameterValidationService.isNameUnique(externalTool))) {
						externalTool.name = `${externalTool.name} - [${fetchedMetadata.mediumId}]`;
					}

					await this.externalToolValidationService.validateUpdate(externalTool.id, externalTool);

					statusReports.success.count++;

					return externalTool;
				} catch {
					statusReports.failure.count++;

					return null;
				}
			}
		);

		const updatedExternalTools: ExternalTool[] = (await Promise.all(updatePromises)).filter(
			(updateResult: ExternalTool | null): updateResult is ExternalTool => !!updateResult
		);

		if (updatedExternalTools.length) {
			await this.externalToolService.updateExternalTools(updatedExternalTools);
		}

		const report: MediaSourceSyncReport = ReportFactory.buildFromOperations([
			statusReports.success,
			statusReports.failure,
			statusReports.undelivered,
		]);

		return report;
	}

	private isMetadataUpToDate(externalTool: ExternalTool, metadata: MediumMetadataDto): boolean {
		if (!metadata.modifiedAt) {
			return false;
		}

		const isUpToDate: boolean =
			!!externalTool.medium?.metadataModifiedAt &&
			externalTool.medium.metadataModifiedAt.getTime() >= metadata.modifiedAt.getTime();

		return isUpToDate;
	}

	protected abstract updateExternalToolMetadata(externalTool: ExternalTool, metadata: MediumMetadataDto): Promise<void>;
}
