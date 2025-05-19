import { Logger } from '@core/logger';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { MediumMetadataLogoService } from '@modules/medium-metadata/service/medium-metadata-logo.service';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoSizeExceededLoggableException } from '@modules/tool/external-tool/loggable';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common';
import { ImageMimeType } from '@shared/domain/types';
import {
	MediaSourceSyncOperationReportFactory as OperationReportFactory,
	MediaSourceSyncReportFactory as ReportFactory,
} from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { MediaMetadataSyncFailedLoggable, UnknownLogoFileTypeLoggableException } from '../../loggable';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
export class VidisMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		private readonly mediumMetadataLogoService: MediumMetadataLogoService,
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
		const statusReports = {
			updateSuccess: OperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.UPDATE),
			failure: OperationReportFactory.buildWithFailedStatus(MediaSourceSyncOperation.ANY),
			partial: OperationReportFactory.buildWithPartialStatus(MediaSourceSyncOperation.ANY),
			undelivered: OperationReportFactory.buildUndeliveredReport(),
		};

		const updatePromises = externalTools.map(async (externalTool: ExternalTool): Promise<ExternalTool | null> => {
			const fetchedMetadata = metadataItemsFromVidis.find(
				(metadataFromVidis: MediumMetadataDto) => externalTool.medium?.mediumId === metadataFromVidis.mediumId
			);

			if (!fetchedMetadata) {
				statusReports.undelivered.count++;
				return null;
			}

			if (this.isMetadataUpToDate(externalTool, fetchedMetadata)) {
				statusReports.updateSuccess.count++;
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
					statusReports.failure.count++;
					return null;
				}
			}

			if (status === MediaSourceSyncStatus.SUCCESS) {
				statusReports.updateSuccess.count++;
			} else {
				statusReports.partial.count++;
			}

			return externalTool;
		});

		const updatedExternalTools: ExternalTool[] = (await Promise.all(updatePromises)).filter(
			(updateResult: ExternalTool | null): updateResult is ExternalTool => !!updateResult
		);

		if (updatedExternalTools.length) {
			await this.externalToolService.updateExternalTools(updatedExternalTools);
		}

		const report: MediaSourceSyncReport = ReportFactory.buildFromOperations([
			statusReports.updateSuccess,
			statusReports.failure,
			statusReports.partial,
			statusReports.undelivered,
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
		let status: MediaSourceSyncStatus = MediaSourceSyncStatus.SUCCESS;
		if (!vidisMetadata.logo) {
			return status;
		}

		const originalLogo: string | undefined = externalTool.logo;
		const originalLogoUrl: string | undefined = externalTool.logoUrl;

		try {
			const contentType: ImageMimeType | undefined = this.mediumMetadataLogoService.detectAndValidateLogoImageType(
				vidisMetadata.logo
			);

			if (!contentType) {
				throw new UnknownLogoFileTypeLoggableException();
			}

			const logo = `data:${contentType.valueOf()};base64,${vidisMetadata.logo}`;

			externalTool.logo = logo;
			externalTool.logoUrl = logo;

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
