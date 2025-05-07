import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { ExternalTool, ExternalToolService } from '@modules/tool';
import { Injectable } from '@nestjs/common';
import { MediaSourceSyncReport } from '../../interface';
import { MediaSourceSyncReportFactory as ReportFactory } from '../../factory';

@Injectable()
export abstract class BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService
	) {}

	public abstract getMediaSourceFormat(): MediaSourceDataFormat;

	protected abstract syncExternalToolMediumMetadata(
		externalTools: ExternalTool[],
		metadataItems: MediumMetadataDto[]
	): Promise<MediaSourceSyncReport>;

	public async syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		const externalTools: ExternalTool[] = await this.getAllToolsWithMedium(mediaSource);

		if (!externalTools.length) {
			const emptyReport = ReportFactory.buildEmptyReport();
			return emptyReport;
		}

		const metadataItems: MediumMetadataDto[] = await this.getMediaMetadata(externalTools, mediaSource);

		const report: MediaSourceSyncReport = await this.syncExternalToolMediumMetadata(externalTools, metadataItems);

		return report;
	}

	protected async getAllToolsWithMedium(mediaSource: MediaSource): Promise<ExternalTool[]> {
		const externalTools: ExternalTool[] = await this.externalToolService.findExternalToolsByMediaSource(
			mediaSource.sourceId
		);

		return externalTools;
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
}
