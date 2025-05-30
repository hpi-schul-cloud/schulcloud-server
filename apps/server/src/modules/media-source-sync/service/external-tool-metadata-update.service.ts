import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto } from '@modules/medium-metadata';
import { ExternalTool, ExternalToolLogoService } from '@modules/tool';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalToolMetadataUpdateService {
	constructor(private readonly externalToolLogoService: ExternalToolLogoService) {}

	public async updateExternalToolWithMetadata(
		externalTool: ExternalTool,
		metadata: MediumMetadataDto,
		format: MediaSourceDataFormat
	): Promise<void> {
		switch (format) {
			case MediaSourceDataFormat.VIDIS:
				await this.updateExternalToolWithVidisMetadata(externalTool, metadata);
				break;
			case MediaSourceDataFormat.BILDUNGSLOGIN:
				await this.updateExternalToolWithBiloMetadata(externalTool, metadata);
				break;
			default:
				break;
		}
	}

	private async updateExternalToolWithVidisMetadata(
		externalTool: ExternalTool,
		metadata: MediumMetadataDto
	): Promise<void> {
		const logo: string | undefined = await this.externalToolLogoService.fetchLogo({ logoUrl: metadata.logoUrl });

		if (metadata.name !== '') {
			externalTool.name = metadata.name;
		}
		externalTool.description = metadata.description;
		externalTool.logoUrl = metadata.logoUrl;
		externalTool.logo = logo;
	}

	private async updateExternalToolWithBiloMetadata(
		externalTool: ExternalTool,
		metadata: MediumMetadataDto
	): Promise<void> {
		const logo: string | undefined = await this.externalToolLogoService.fetchLogo({ logoUrl: metadata.logoUrl });

		externalTool.name = metadata.name;
		externalTool.description = metadata.description;
		externalTool.logoUrl = metadata.logoUrl;
		externalTool.logo = logo;

		if (externalTool.medium) {
			externalTool.medium.publisher = metadata.publisher;
			externalTool.medium.metadataModifiedAt = metadata.modifiedAt;
		}
	}
}
