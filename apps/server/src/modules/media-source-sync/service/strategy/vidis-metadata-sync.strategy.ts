import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataService } from '@modules/medium-metadata';
import { ExternalToolService } from '@modules/tool';
import { ImageMimeType } from '@modules/tool/common';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common';
import {
	MediaSourceSyncReportFactory as ReportFactory,
	MediaSourceSyncOperationReportFactory as OperationReportFactory,
} from '../../factory';
import { MediaSourceSyncReport, MediaSourceSyncStrategy } from '../../interface';
import { MediaSourceSyncOperation } from '../../types';
import { MediumMetadataDto } from '@modules/medium-metadata/dto';

@Injectable()
export class VidisMetadataSyncStrategy implements MediaSourceSyncStrategy {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly externalToolValidationService: ExternalToolValidationService,
		private readonly mediumMetadataService: MediumMetadataService,
		private readonly logger: Logger
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	public async syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		const externalTools: ExternalTool[] = await this.getAllToolsWithVidisMedium(mediaSource);
		if (!externalTools.length) {
			const emptyReport = ReportFactory.buildEmptyReport();
			return emptyReport;
		}

		const mediumIds: string[] = externalTools
			.map((externalTool: ExternalTool) => externalTool.medium?.mediumId)
			.filter((mediumId: string | undefined): mediumId is string => !!mediumId);

		const vidisMediaMetadata: MediumMetadataDto[] = await this.mediumMetadataService.getMetadataItems(
			mediumIds,
			mediaSource
		);

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
		metadataItemsFromVidis: MediumMetadataDto[]
	): Promise<MediaSourceSyncReport> {
		const updateSuccessReport = OperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.UPDATE);
		const failureReport = OperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY);
		const undeliveredReport = OperationReportFactory.buildUndeliveredReport();

		const updatePromises = externalTools.map(async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
			const fetchedMetadata = metadataItemsFromVidis.find(
				(metadataFromVidis: MediumMetadataDto) => externalTool.medium?.mediumId === metadataFromVidis.mediumId
			);

			if (!fetchedMetadata) {
				undeliveredReport.count += 1;
				return null;
			}

			try {
				this.mapVidisMetadataToExternalToolMedium(externalTool, fetchedMetadata);
				await this.externalToolValidationService.validateUpdate(externalTool.id, externalTool);
			} catch (error: unknown) {
				// TODO validation error loggable
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

		const report: MediaSourceSyncReport = ReportFactory.buildFromOperations([
			updateSuccessReport,
			failureReport,
			undeliveredReport,
		]);

		return report;
	}

	private mapVidisMetadataToExternalToolMedium(externalTool: ExternalTool, vidisMetadata: MediumMetadataDto): void {
		if (vidisMetadata.name !== '') {
			externalTool.name = vidisMetadata.name;
		}

		if (vidisMetadata.logo) {
			externalTool.logo = vidisMetadata.logo;
			externalTool.logoUrl = this.buildDataUriFromBase64Image(vidisMetadata.logo);
		}

		externalTool.description = vidisMetadata.description;

		const medium = externalTool.medium as ExternalToolMedium;
		medium.publisher = vidisMetadata.publisher;
	}

	private buildDataUriFromBase64Image(rawImage: string): string {
		const contentType: ImageMimeType = this.externalToolLogoService.detectAndValidateLogoImageType(rawImage);

		const dataURI = `data:${contentType.valueOf()};base64,${rawImage}`;

		return dataURI;
	}
}
