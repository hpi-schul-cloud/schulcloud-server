import { Logger } from '@core/logger';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { ExternalToolService } from '@modules/tool';
import { ImageMimeType } from '@modules/tool/common';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoSizeExceededLoggableException } from '@modules/tool/external-tool/loggable';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common';
import {
	MediaSourceSyncReportFactory as ReportFactory,
	MediaSourceSyncOperationReportFactory as OperationReportFactory,
} from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { MediaMetadataSyncFailedLoggable } from '../../loggable';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
export class VidisMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly externalToolValidationService: ExternalToolValidationService,
		private readonly logger: Logger
	) {
		super(externalToolService, mediumMetadataService);
	}

	public override getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	public override async syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport> {
		const report = await super.syncAllMediaMetadata(mediaSource);

		return report;
	}

	protected override async syncExternalToolMediumMetadata(
		externalTools: ExternalTool[],
		metadataItemsFromVidis: MediumMetadataDto[]
	): Promise<MediaSourceSyncReport> {
		const updateSuccessReport = OperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.UPDATE);
		const failureReport = OperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY);
		const partialReport = OperationReportFactory.buildWithPartialStatus(MediaSourceSyncOperation.ANY);
		const undeliveredReport = OperationReportFactory.buildUndeliveredReport();

		const updatePromises = externalTools.map(async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
			const fetchedMetadata = metadataItemsFromVidis.find(
				(metadataFromVidis: MediumMetadataDto) => externalTool.medium?.mediumId === metadataFromVidis.mediumId
			);

			if (!fetchedMetadata) {
				undeliveredReport.count += 1;
				return null;
			}

			if (this.isMetadataUpToDate(externalTool, fetchedMetadata)) {
				updateSuccessReport.count += 1;
				return null;
			}

			if (fetchedMetadata.name !== '') {
				externalTool.name = fetchedMetadata.name;
			}
			externalTool.description = fetchedMetadata.description;

			const status = this.syncAndValidateLogo(externalTool, fetchedMetadata);

			try {
				await this.externalToolValidationService.validateUpdate(externalTool.id, externalTool);
			} catch (error: unknown) {
				if (!(error instanceof ExternalToolLogoSizeExceededLoggableException)) {
					this.logger.warning(
						new MediaMetadataSyncFailedLoggable(fetchedMetadata.mediumId, this.getMediaSourceFormat(), error)
					);
					failureReport.count += 1;
					return null;
				}
			}

			if (status === MediaSourceSyncStatus.SUCCESS) {
				updateSuccessReport.count += 1;
			} else {
				partialReport.count += 1;
			}

			return externalTool;
		});

		const updatedExternalTools: ExternalTool[] = (await Promise.all(updatePromises)).filter(
			(updateResult: ExternalTool | null) => !!updateResult
		);

		if (updatedExternalTools.length) {
			await this.externalToolService.updateExternalTools(updatedExternalTools);
		}

		const report: MediaSourceSyncReport = ReportFactory.buildFromOperations([
			updateSuccessReport,
			failureReport,
			partialReport,
			undeliveredReport,
		]);

		return report;
	}

	private isMetadataUpToDate(externalTool: ExternalTool, vidisMetadata: MediumMetadataDto): boolean {
		if (externalTool.description != vidisMetadata.description) {
			return false;
		}

		const hasNameAndUnequal = vidisMetadata.name !== '' && externalTool.name !== vidisMetadata.name;
		const hasLogoAndUnequal = vidisMetadata.logo !== undefined && externalTool.logo !== vidisMetadata.logo;

		const isUpToDate = !hasNameAndUnequal && !hasLogoAndUnequal;

		return isUpToDate;
	}

	private syncAndValidateLogo(
		externalTool: ExternalTool,
		vidisMetadata: MediumMetadataDto
	): MediaSourceSyncStatus.SUCCESS | MediaSourceSyncStatus.PARTIAL {
		let status = MediaSourceSyncStatus.SUCCESS;
		if (!vidisMetadata.logo) {
			return status;
		}

		const originalLogo = externalTool.logo;
		const originalLogoUrl = externalTool.logoUrl;

		try {
			const contentType: ImageMimeType = this.externalToolLogoService.detectAndValidateLogoImageType(
				vidisMetadata.logo
			);

			externalTool.logo = vidisMetadata.logo;
			externalTool.logoUrl = `data:${contentType.valueOf()};base64,${vidisMetadata.logo}`;

			this.externalToolLogoService.validateLogoSize(externalTool);
		} catch (error: unknown) {
			status = MediaSourceSyncStatus.PARTIAL;

			externalTool.logo = originalLogo;
			externalTool.logoUrl = originalLogoUrl;

			this.logger.warning(
				new MediaMetadataSyncFailedLoggable(vidisMetadata.mediumId, this.getMediaSourceFormat(), error)
			);
		}

		return status;
	}
}
