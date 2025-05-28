import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
export class VidisMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		protected readonly externalToolValidationService: ExternalToolValidationService,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {
		super(externalToolService, mediumMetadataService, externalToolValidationService);
	}

	public override getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	protected override async updateExternalToolMetadata(
		externalTool: ExternalTool,
		metadata: MediumMetadataDto
	): Promise<void> {
		if (metadata.name !== '') {
			externalTool.name = metadata.name;
		}
		externalTool.description = metadata.description;
		externalTool.logoUrl = metadata.logoUrl;
		externalTool.logo = await this.externalToolLogoService.fetchLogo({ logoUrl: metadata.logoUrl });

		if (externalTool.medium?.status === ExternalToolMediumStatus.DRAFT) {
			externalTool.medium.status = ExternalToolMediumStatus.ACTIVE;
		}
	}
}
