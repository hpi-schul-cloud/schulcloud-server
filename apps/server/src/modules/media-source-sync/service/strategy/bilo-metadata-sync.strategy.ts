import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import {
	ExternalTool,
	ExternalToolService,
	ExternalToolLogoService,
	ExternalToolMediumStatus,
	ExternalToolValidationService,
	ExternalToolParameterValidationService,
} from '@modules/tool';
import { Injectable } from '@nestjs/common';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
export class BiloMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		protected readonly externalToolValidationService: ExternalToolValidationService,
		protected readonly externalToolParameterValidationService: ExternalToolParameterValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {
		super(
			externalToolService,
			mediumMetadataService,
			externalToolValidationService,
			externalToolParameterValidationService
		);
	}

	public override getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	protected override async updateExternalToolMetadata(
		externalTool: ExternalTool,
		metadata: MediumMetadataDto
	): Promise<void> {
		externalTool.name = metadata.name;
		externalTool.description = metadata.description;
		externalTool.logoUrl = metadata.logoUrl;
		externalTool.logo = await this.externalToolLogoService.fetchLogo({ logoUrl: metadata.logoUrl });

		if (externalTool.medium) {
			externalTool.medium.publisher = metadata.publisher;
			externalTool.medium.metadataModifiedAt = metadata.modifiedAt;

			if (externalTool.medium.status === ExternalToolMediumStatus.DRAFT) {
				externalTool.medium.status = ExternalToolMediumStatus.ACTIVE;
			}
		}
	}
}
